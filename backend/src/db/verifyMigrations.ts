import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool } from 'pg';

// Day 89: TALAGANG na-apply ba ang lahat ng migration? Ang "Migrations applied" ng migrate() ay hindi patunay:
// sa reference (#21), nag-print ito ng "applied successfully" gamit ang LUMANG migrate image, kaya ang bagong code
// ay tumakbo sa database na kulang ng table. Kaya ikinukumpara ang dalawang listahan:
//   - ang journal na nasa IMAGE (drizzle/meta/_journal.json) — ang inaasahan ng code
//   - ang talaan sa DATABASE (drizzle.__drizzle_migrations) — ang talagang na-apply
// Ang pagkakakilanlan ng bawat migration: ang `when` sa journal = `created_at` sa database (ganoon itinatala ng drizzle)

export interface MigrationCheck {
  expected: number; // ilan ang nasa journal ng image
  applied: number; // ilan ang nasa database
  missing: string[]; // nasa image pero WALA sa database → hindi na-apply (bawal mag-restart)
  extra: number; // nasa database pero WALA sa image → mas bago ang schema kaysa sa code (rollback)
}

export async function verifyMigrations(pool: Pool, migrationsFolder: string): Promise<MigrationCheck> {
  const journal = JSON.parse(await readFile(join(migrationsFolder, 'meta/_journal.json'), 'utf8')) as {
    entries: { tag: string; when: number }[];
  };
  const { rows } = await pool.query<{ created_at: string }>('select created_at from drizzle.__drizzle_migrations');
  const appliedAt = new Set(rows.map((row) => Number(row.created_at)));
  const expectedAt = new Set(journal.entries.map((entry) => entry.when));
  return {
    expected: journal.entries.length,
    applied: rows.length,
    missing: journal.entries.filter((entry) => !appliedAt.has(entry.when)).map((entry) => entry.tag),
    extra: [...appliedAt].filter((when) => !expectedAt.has(when)).length,
  };
}
