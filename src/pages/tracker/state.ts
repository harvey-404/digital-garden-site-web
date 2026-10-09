import type { Period } from '../../types/tracker';

export type TrackerQuery = { date: string; period: Period };

export function queryKey(query: TrackerQuery): string {
  return `${query.date}|${query.period}`;
}

export function canApplySnapshot(requestKey: string, currentKey: string, requestVersion: number, latestVersion: number): boolean {
  return requestKey === currentKey && requestVersion === latestVersion;
}
