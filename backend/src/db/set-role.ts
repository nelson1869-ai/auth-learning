import { eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { z } from 'zod';
import { roleEnum, users } from './schema.ts';

// Gawing admin (o ibalik sa user) ang isang account na NAKA-REGISTER NA (Day 45).
//
//   dev:         npm run db:set-role -- ikaw@example.com admin
//   production:  docker run --rm --env-file ../backend/.env.production <image> node src/db/set-role.ts ikaw@example.com admin
//
// Bakit hindi "seed" na may admin@example.com / adminpassword123 (tulad ng reference)?
// Public ang repo — kapag napatakbo iyon sa production, may admin na alam ng LAHAT ang password.
// Dito: ikaw ang pumili ng password noong nag-register ka; walang password sa code.

const argsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()), // pareho ng registerSchema — lowercase ang naka-save
  role: z.enum(roleEnum.enumValues),
});

// Hiwalay sa CLI para masubukan (set-role.test.ts). Ligtas patakbuhin nang paulit-ulit (idempotent)
export async function setRole(database: NodePgDatabase, input: { email: string; role: string }) {
  const { email, role } = argsSchema.parse(input);
  const [user] = await database
    .update(users)
    .set({ role })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });
  return user; // undefined = walang ganitong account
}

// Tumatakbo lang kapag direktang pinatakbo (node src/db/set-role.ts ...), hindi kapag ini-import ng test
if (import.meta.main) {
  const [email = '', role = ''] = process.argv.slice(2);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5_000 });
  try {
    const user = await setRole(drizzle(pool), { email, role });
    if (!user) {
      console.error(`No account with email ${email} — register first, then run this again.`);
      process.exitCode = 1;
    } else {
      console.log(`✅ ${user.email} (id ${user.id}) is now: ${user.role}`);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('Usage: set-role.ts <email> <user|admin>');
      process.exitCode = 1;
    } else {
      throw err;
    }
  } finally {
    await pool.end();
  }
}
