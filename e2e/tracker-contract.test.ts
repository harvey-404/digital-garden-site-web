import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, progressText, progressLabel, ruleText, recordEditPayload, periodLabel, toUtc, localDisplay, timerElapsed, visibleHistoryRecords, retryRequestId } from '../src/pages/tracker/format.ts';

test('seconds remain visible at a one-second overage', () => {
  assert.equal(formatDuration(1), '1秒');
  assert.equal(formatDuration(61), '1分1秒');
  assert.equal(formatDuration(3600), '1小时');
});

test('minimum count uses qualified sessions and maximum uses raw count', () => {
  const base = { count: 3, qualifiedCount: 2, durationSeconds: 0, goalValue: 2, remaining: 0, excess: 1 };
  assert.equal(progressText({ ...base, rule: { metric: 'COUNT', direction: 'MIN', target: 3 } }), '2 / 3 次');
  assert.equal(progressText({ ...base, rule: { metric: 'COUNT', direction: 'MAX', target: 2 } }), '3 / 2 次');
});

test('future statistics-only version and exclusive period end are legible', () => {
  assert.equal(ruleText({ period: null, metric: null, direction: null, target: 0, sessionDirection: null, sessionSeconds: null, effectiveFrom: '2026-10-12' }), '10月12日起 · 仅统计');
  assert.equal(periodLabel('2026-10-05', '2026-10-12'), '10月5日 - 10月11日');
});

test('note-only edit retains original nanoseconds and paused duration', () => {
  const source = { quantity: 1, startedAt: '2026-10-09T02:03:04.123456789Z', durationSeconds: 61, note: '' };
  const display = '2026-10-09T10:03';
  assert.deepEqual(recordEditPayload(source, { quantity: 2, startDisplay: display, initialStartDisplay: display, durationMinutes: '1.02', initialDurationMinutes: '1.02', note: '调整' }, 'Asia/Shanghai'), {
    quantity: 2, startedAt: source.startedAt, durationSeconds: 61, note: '调整',
  });
});

test('account timezone datetime round trips and rejects nonexistent DST wall time', () => {
  assert.equal(localDisplay(toUtc('2026-10-09T10:03', 'Asia/Shanghai'), 'Asia/Shanghai'), '2026-10-09T10:03');
  assert.throws(() => toUtc('2026-03-08T02:30', 'America/New_York'), /不存在/);
});

test('live timer adds only elapsed since server synchronization', () => {
  assert.equal(timerElapsed({ elapsedSeconds: 90, state: 'RUNNING' }, 100000, 105500), 95);
  assert.equal(timerElapsed({ elapsedSeconds: 90, state: 'PAUSED' }, 100000, 105500), 90);
});

test('session overage does not claim periodic count overage of zero', () => {
  const rule = { period: 'WEEK', metric: 'COUNT', direction: 'MIN', target: 3, sessionDirection: 'MAX', sessionSeconds: 7200, effectiveFrom: '2026-10-09', id: 1 };
  const summary = { rule, status: 'OVER', remaining: 1, excess: 0, sessionExceeded: 1 };
  assert.equal(progressLabel(summary), '还差1次 · 1次单次时长超限');
  assert.equal(progressLabel({ ...summary, status: 'DONE', remaining: 0, sessionExceeded: 0 }), '目标已达成');
});

test('history never renders records loaded for a different activity or period', () => {
  const old = [{ id: 1, activityId: 8 }];
  assert.deepEqual(visibleHistoryRecords('9|2026-10-09|WEEK', '8|2026-10-09|WEEK', old), []);
  assert.deepEqual(visibleHistoryRecords('8|2026-10-09|DAY', '8|2026-10-09|WEEK', old), []);
  assert.deepEqual(visibleHistoryRecords('8|2026-10-09|WEEK', '8|2026-10-09|WEEK', old), old);
});

test('identical retried payload reuses request ID but edited payload gets a new one', () => {
  const first = retryRequestId(null, 'goal A', () => 'id-1');
  assert.equal(retryRequestId(first, 'goal A', () => 'id-2').id, 'id-1');
  assert.equal(retryRequestId(first, 'goal B', () => 'id-2').id, 'id-2');
});
