// TEST database at mga secret — bago pa ma-import ang app (built-in sa Node, kapareho ng --env-file)
process.loadEnvFile('.env.test');

// Pananggalang: huwag kailanman patakbuhin ang tests sa dev database (binubura nila ang users)
if (!process.env.DATABASE_URL?.endsWith('_test')) {
  throw new Error('Tests must use a *_test database — check backend/.env.test');
}
