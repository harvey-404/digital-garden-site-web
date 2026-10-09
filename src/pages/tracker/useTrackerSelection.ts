import { useEffect, useLayoutEffect, type RefObject } from 'react';
import type { Period } from '../../types/tracker';
import { localDisplay } from './format.ts';
import { normalizeSelectedDate, type TrackerQuery } from './state.ts';

// Empty date follows today in the account timezone; a picked date remains fixed.
export function useTrackerSelection(date: string, period: Period, zone: string, tick: number, enabled: boolean, refresh: (date: string, period: Period) => Promise<void>, selectionRef: RefObject<TrackerQuery>) {
  const displayDate = normalizeSelectedDate(date, localDisplay(new Date(tick).toISOString(), zone).slice(0, 10));
  useLayoutEffect(() => {
    selectionRef.current = { date: displayDate, period };
  }, [displayDate, period, selectionRef]);
  useEffect(() => {
    if (enabled) void refresh(displayDate, period);
  }, [enabled, displayDate, period, refresh]);
  return { displayDate, selectionRef };
}
