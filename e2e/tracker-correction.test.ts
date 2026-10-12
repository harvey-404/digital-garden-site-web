import test from 'node:test';
import assert from 'node:assert/strict';

const correction = await import('../src/pages/tracker/countCorrection.ts').catch(() => ({}));
function feature() {
  assert.equal(typeof correction.planCountCorrection, 'function', '缺少快捷减一次的记录修正逻辑');
  assert.equal(typeof correction.applyCountCorrection, 'function');
  return correction;
}
const scope = { activityId: 7, periodStart: '2026-10-10', periodEnd: '2026-10-11', zone: 'Asia/Shanghai' };
const entry = (overrides = {}) => ({ id: 1, activityId: 7, quantity: 3, startedAt: '2026-10-10T01:02:03.123456789Z', durationSeconds: 61, note: '保留原备注', deleted: false, ...overrides });
function repository(source) {
  let current = structuredClone(source);
  const writes = [];
  let failAfterWrite = false;
  const port = {
    read: async () => structuredClone(current),
    editRecord: async (id, data) => { writes.push(['edit', id, data]); current = { ...current, ...data }; if (failAfterWrite) { failAfterWrite = false; throw new Error('response lost'); } return current; },
    deleted: async (id, deleted) => { writes.push(['deleted', id, deleted]); current.deleted = deleted; if (failAfterWrite) { failAfterWrite = false; throw new Error('response lost'); } },
  };
  return { port, writes, current: () => current, loseResponse: () => { failAfterWrite = true; }, change: data => { current = { ...current, ...data }; } };
}

test('subtracts exactly one from the latest started record in the account period, preserving precise time and duration', () => {
  const { planCountCorrection } = feature();
  const latest = entry({ id: 6 });
  const plan = planCountCorrection([
    entry({ id: 20, activityId: 9 }), entry({ id: 30, deleted: true }),
    entry({ id: 40, startedAt: '2026-10-09T15:59:59Z' }),
    entry({ id: 50, startedAt: '2026-10-10T16:00:00Z' }),
    entry({ id: 2, startedAt: '2026-10-09T16:00:00Z' }), latest,
  ], scope);
  assert.deepEqual(plan.before, latest);
  assert.deepEqual(plan.after, { ...latest, quantity: 2 });
});

test('one remaining unit uses reversible deletion and undo restores it without negative records', async () => {
  const { planCountCorrection, applyCountCorrection } = feature();
  const source = entry({ quantity: 1 });
  const plan = planCountCorrection([source], scope);
  const repo = repository(source);
  await applyCountCorrection(plan, repo.port);
  assert.deepEqual(repo.current(), { ...source, deleted: true });
  await applyCountCorrection(plan, repo.port, true);
  assert.deepEqual(repo.current(), source);
  assert.deepEqual(repo.writes, [['deleted', 1, true], ['deleted', 1, false]]);
});

test('empty period cannot reduce another period or make a count negative', () => {
  const { planCountCorrection } = feature();
  assert.throws(() => planCountCorrection([entry({ deleted: true }), entry({ startedAt: '2026-10-09T15:59:59Z' })], scope), /没有可减少/);
});

test('lost mutation response retry cannot subtract a second unit', async () => {
  const { planCountCorrection, applyCountCorrection } = feature();
  const source = entry();
  const plan = planCountCorrection([source], scope);
  const repo = repository(source);
  repo.loseResponse();
  await assert.rejects(applyCountCorrection(plan, repo.port), /response lost/);
  await applyCountCorrection(plan, repo.port);
  assert.equal(repo.current().quantity, 2);
  assert.equal(repo.writes.length, 1);
});

test('undo of a multi-unit record preserves exact metadata and restores only that quantity', async () => {
  const { planCountCorrection, applyCountCorrection } = feature();
  const source = entry();
  const plan = planCountCorrection([source], scope);
  const repo = repository(source);
  await applyCountCorrection(plan, repo.port);
  await applyCountCorrection(plan, repo.port, true);
  assert.deepEqual(repo.current(), source);
  assert.equal(repo.writes[0][2].startedAt, source.startedAt);
  assert.equal(repo.writes[0][2].durationSeconds, 61);
});

test('a changed record is not overwritten by stale correction or undo', async () => {
  const { planCountCorrection, applyCountCorrection } = feature();
  const source = entry();
  const plan = planCountCorrection([source], scope);
  const repo = repository(source);
  repo.change({ quantity: 5 });
  await assert.rejects(applyCountCorrection(plan, repo.port), /记录已变化/);
  assert.equal(repo.writes.length, 0);
  repo.change(plan.after);
  repo.change({ note: '之后修改的备注' });
  await assert.rejects(applyCountCorrection(plan, repo.port, true), /记录已变化/);
  assert.equal(repo.current().note, '之后修改的备注');
});

test('lost undo response retry does not restore a second unit', async () => {
  const { planCountCorrection, applyCountCorrection } = feature();
  const source = entry();
  const plan = planCountCorrection([source], scope);
  const repo = repository(source);
  await applyCountCorrection(plan, repo.port);
  repo.loseResponse();
  await assert.rejects(applyCountCorrection(plan, repo.port, true), /response lost/);
  await applyCountCorrection(plan, repo.port, true);
  assert.deepEqual(repo.current(), source);
  assert.equal(repo.writes.length, 2);
});
