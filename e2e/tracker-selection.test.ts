import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, useRef } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useTrackerSelection } from '../src/pages/tracker/useTrackerSelection.ts';
import { canApplySnapshot, queryKey, type TrackerQuery } from '../src/pages/tracker/state.ts';
import { requestedPeriodLabel } from '../src/pages/tracker/format.ts';
import type { Period } from '../src/types/tracker.ts';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

async function selectionClock(zone: string, period: Period, initialTime: string, date = '') {
  const requests: string[] = [];
  const refresh = async (date: string, period: Period) => { requests.push(queryKey({ date, period })); };
  let latest!: ReturnType<typeof useTrackerSelection>;
  function Probe({ time, selectedDate }: { time: string; selectedDate: string }) {
    const selectionRef = useRef<TrackerQuery>({ date: '', period });
    latest = useTrackerSelection(selectedDate, period, zone, Date.parse(time), true, refresh, selectionRef);
    return null;
  }
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(createElement(Probe, { time: initialTime, selectedDate: date })); });
  return {
    requests,
    get current() { return latest; },
    async move(time: string, selectedDate = date) {
      await act(async () => { renderer.update(createElement(Probe, { time, selectedDate })); });
    },
    async close() { await act(async () => { renderer.unmount(); }); },
  };
}

test('Shanghai automatic day selection refreshes at midnight and invalidates yesterday', async () => {
  const clock = await selectionClock('Asia/Shanghai', 'DAY', '2026-10-09T15:59:59Z');
  try {
    const previousKey = queryKey(clock.current.selectionRef.current);
    await clock.move('2026-10-09T16:00:00Z');
    assert.equal(clock.current.displayDate, '2026-10-10');
    assert.equal(queryKey(clock.current.selectionRef.current), '2026-10-10|DAY');
    assert.deepEqual(clock.requests, ['2026-10-09|DAY', '2026-10-10|DAY']);
    assert.equal(canApplySnapshot(previousKey, queryKey(clock.current.selectionRef.current), 1, 1), false);
    await clock.move('2026-10-09T16:00:01Z');
    assert.equal(clock.requests.length, 2, 'seconds within one calendar day must not reload');
  } finally { await clock.close(); }
});

test('Shanghai automatic week moves to the new Monday and uses its query for mutations', async () => {
  const clock = await selectionClock('Asia/Shanghai', 'WEEK', '2026-10-11T15:59:59Z');
  try {
    assert.equal(requestedPeriodLabel(clock.current.displayDate, 'WEEK'), '10月5日 - 10月11日');
    await clock.move('2026-10-11T16:00:00Z');
    assert.equal(requestedPeriodLabel(clock.current.displayDate, 'WEEK'), '10月12日 - 10月18日');
    assert.equal(queryKey(clock.current.selectionRef.current), '2026-10-12|WEEK');
    assert.deepEqual(clock.requests, ['2026-10-11|WEEK', '2026-10-12|WEEK']);
  } finally { await clock.close(); }
});

test('account New York midnight controls queries independently of host timezone', async () => {
  const clock = await selectionClock('America/New_York', 'DAY', '2026-10-10T03:59:59Z');
  try {
    assert.equal(clock.current.displayDate, '2026-10-09');
    await clock.move('2026-10-10T04:00:00Z');
    assert.equal(clock.current.displayDate, '2026-10-10');
    assert.deepEqual(clock.requests, ['2026-10-09|DAY', '2026-10-10|DAY']);
    assert.equal(queryKey(clock.current.selectionRef.current), '2026-10-10|DAY');
  } finally { await clock.close(); }
});

test('explicit history stays fixed across Monday; resetting to empty resumes following today', async () => {
  const clock = await selectionClock('Asia/Shanghai', 'WEEK', '2026-10-11T15:59:59Z', '2026-10-01');
  try {
    await clock.move('2026-10-11T16:00:00Z');
    assert.equal(clock.current.displayDate, '2026-10-01');
    assert.equal(queryKey(clock.current.selectionRef.current), '2026-10-01|WEEK');
    assert.deepEqual(clock.requests, ['2026-10-01|WEEK']);
    await clock.move('2026-10-11T16:00:00Z', '');
    assert.equal(queryKey(clock.current.selectionRef.current), '2026-10-12|WEEK');
    await clock.move('2026-10-12T16:00:00Z', '');
    assert.equal(queryKey(clock.current.selectionRef.current), '2026-10-13|WEEK');
  } finally { await clock.close(); }
});
