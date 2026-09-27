// Mga error ng Postgres na may sariling kahulugan sa app (hindi pang-HTTP — ang controller ang magpapasya ng status)

// 23505 = unique violation. Nasa err.cause ang code, hindi err.code (binabalot ni Drizzle).
// Sa catch, `unknown` ang error — suriin muna ang hugis bago basahin (nahuli ng TypeScript)
export function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    typeof err.cause === 'object' &&
    err.cause !== null &&
    'code' in err.cause &&
    err.cause.code === '23505'
  );
}
