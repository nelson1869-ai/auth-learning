import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { verifyMigrations } from './verifyMigrations.ts';

// Day 89: ang test database ay na-migrate na (CI: `drizzle-kit migrate`; lokal: gaya rin). Hindi binabago ang database dito —
// ang JOURNAL ang binabago (sa isang pansamantalang folder), para gayahin ang "image na mas bago" at "image na mas luma"
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let journal: { entries: { idx: number; tag: string; when: number }[] };
let dir: string;

beforeAll(async () => {
  journal = JSON.parse(await readFile('drizzle/meta/_journal.json', 'utf8'));
  dir = await mkdtemp(join(tmpdir(), 'journal-'));
  await mkdir(join(dir, 'meta'));
});
afterAll(async () => {
  await pool.end();
  await rm(dir, { recursive: true, force: true });
});
async function withJournal(entries: typeof journal.entries): Promise<string> {
  await writeFile(join(dir, 'meta/_journal.json'), JSON.stringify({ ...journal, entries }));
  return dir;
}

describe('verifyMigrations', () => {
  it('matches: every migration in the image is applied, nothing extra', async () => {
    const check = await verifyMigrations(pool, 'drizzle');
    expect(check.expected).toBe(journal.entries.length);
    expect(check).toMatchObject({ applied: journal.entries.length, missing: [], extra: 0 });
  });

  it('reports a migration the image expects but the database does not have (must block the restart)', async () => {
    const pending = { idx: 99, tag: '0099_not_applied', when: 1 };
    const check = await verifyMigrations(pool, await withJournal([...journal.entries, pending]));
    expect(check.missing).toEqual(['0099_not_applied']);
  });

  it('reports migrations the database has but the image does not know (an older image = rollback)', async () => {
    const check = await verifyMigrations(pool, await withJournal(journal.entries.slice(0, -2)));
    expect(check).toMatchObject({ missing: [], extra: 2 });
  });
});

// Ang TOTOONG script (gaya ng `docker run IMAGE node src/db/migrate.ts` ng deploy.sh) — ang exit code ang binabasa ng deploy.
// cwd = isang kopya ng drizzle/ na may binagong journal; ang database ay ang test database (hindi binabago ng mga kasong ito)
const script = resolve('src/db/migrate.ts');
async function runMigrate(folder: string, env: Record<string, string> = {}): Promise<{ code: number; output: string }> {
  try {
    const { stdout, stderr } = await promisify(execFile)('node', [script], { cwd: folder, env: { ...process.env, ...env } });
    return { code: 0, output: stdout + stderr };
  } catch (err) {
    const e = err as { code: number; stdout: string; stderr: string };
    return { code: e.code, output: e.stdout + e.stderr };
  }
}
async function imageWith(entries: typeof journal.entries, extraSql?: [string, string]): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'image-'));
  await cp('drizzle', join(folder, 'drizzle'), { recursive: true });
  await writeFile(join(folder, 'drizzle/meta/_journal.json'), JSON.stringify({ ...journal, entries }));
  if (extraSql) await writeFile(join(folder, 'drizzle', `${extraSql[0]}.sql`), extraSql[1]);
  return folder;
}

describe('migrate.ts (the script deploy.sh runs)', () => {
  // Nahuli noong Day 89: ang drizzle ay nag-a-apply lang ng mga migration na MAS BAGO ang `when` kaysa sa huling na-apply.
  // Ang migration na may mas lumang timestamp (hal. mula sa matagal na branch) ay TAHIMIK na nilalaktawan — "applied" pa rin ang sinasabi
  it('fails (exit 1) when drizzle silently skips a migration with an older timestamp', async () => {
    const late = { ...journal.entries.at(-1)!, idx: 99, tag: '0099_from_old_branch', when: journal.entries[0]!.when + 1 };
    const folder = await imageWith([...journal.entries, late], ['0099_from_old_branch', 'SELECT 1;']);
    const result = await runMigrate(folder);
    await rm(folder, { recursive: true, force: true });
    expect(result.code).toBe(1);
    expect(result.output).toContain('Not applied: 0099_from_old_branch');
  });

  it('refuses an older image (database is newer) unless ROLLBACK=1', async () => {
    const folder = await imageWith(journal.entries.slice(0, -1));
    const refused = await runMigrate(folder);
    const allowed = await runMigrate(folder, { ROLLBACK: '1' });
    await rm(folder, { recursive: true, force: true });
    expect(refused.code).toBe(1);
    expect(refused.output).toContain('set ROLLBACK=1');
    expect(allowed.code).toBe(0);
  });

  it('succeeds (exit 0) when every migration is applied', async () => {
    const result = await runMigrate(resolve('.'));
    expect(result.code).toBe(0);
    expect(result.output).toContain('Migrations applied and verified');
  });
});
