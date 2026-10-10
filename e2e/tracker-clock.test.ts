import assert from 'node:assert/strict';
import test from 'node:test';
const module = await import('../src/pages/tracker/recordClock.ts').catch(() => ({}));

test('quick records use server response time even when the device clock is ahead', () => {
  assert.equal(typeof module.RecordClock, 'function');
  const clock = new module.RecordClock();
  clock.observe('Sat, 10 Oct 2026 03:30:00 GMT', 100);
  assert.equal(clock.now(1100, Date.parse('2026-10-10T04:30:01Z')), '2026-10-10T03:30:01.000Z');
});
test('elapsed time is monotonic and a newer response refreshes the server clock', () => {
  const clock = new module.RecordClock();
  clock.observe('Sat, 10 Oct 2026 03:30:00 GMT', 100);
  clock.observe(null, 500);
  assert.equal(clock.now(2100, 0), '2026-10-10T03:30:02.000Z');
  clock.observe('Sat, 10 Oct 2026 03:30:04 GMT', 4200);
  assert.equal(clock.now(5200, 0), '2026-10-10T03:30:05.000Z');
});
test('missing response date falls back to the device time', () => {
  const clock = new module.RecordClock();
  clock.observe('invalid', 100);
  assert.equal(clock.now(200, Date.parse('2026-10-10T03:30:00Z')), '2026-10-10T03:30:00.000Z');
});
