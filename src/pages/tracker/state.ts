import type { Period } from '../../types/tracker';

export type TrackerQuery = { date: string; period: Period };

export function queryKey(query: TrackerQuery): string {
  return `${query.date}|${query.period}`;
}

export function normalizeSelectedDate(value: string, today: string): string {
  return value || today;
}

export function canApplySnapshot(requestKey: string, currentKey: string, requestVersion: number, latestVersion: number): boolean {
  return requestKey === currentKey && requestVersion === latestVersion;
}

export async function quickRecordFromToday(selectToday: () => void, save: () => Promise<boolean>): Promise<boolean> {
  selectToday();
  return save();
}
