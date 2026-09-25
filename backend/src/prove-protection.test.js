import { it, expect } from 'vitest';

// ⚠️ SADYANG BAGSAK — para patunayang hinaharangan ng branch protection ang merge.
// HUWAG I-MERGE. Isasara ang PR at buburahin ang branch pagkatapos.
it('fails on purpose to prove main is protected', () => {
  expect(1 + 1).toBe(3);
});
