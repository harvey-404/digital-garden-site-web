import type { TrackerRecord } from '../../types/tracker.ts';
import { localDisplay } from './format.ts';

export interface CountCorrection { before: TrackerRecord; after: TrackerRecord }
export interface CorrectionPort {
  read: (id: number) => Promise<TrackerRecord | undefined>;
  editRecord: (id: number, data: Pick<TrackerRecord, 'quantity' | 'startedAt' | 'durationSeconds' | 'note'>) => Promise<unknown>;
  deleted: (id: number, deleted: boolean) => Promise<unknown>;
}

export function planCountCorrection(records: TrackerRecord[], scope: {
  activityId: number; periodStart: string; periodEnd: string; zone: string;
}): CountCorrection {
  const latest = records.filter(record => {
    if (record.activityId !== scope.activityId || record.deleted || record.quantity < 1) return false;
    const day = localDisplay(record.startedAt, scope.zone).slice(0, 10);
    return day >= scope.periodStart && day < scope.periodEnd;
  }).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt) || b.id - a.id)[0];
  if (!latest) throw new Error('这个周期没有可减少的记录');
  const before = { ...latest };
  return { before, after: before.quantity === 1 ? { ...before, deleted: true } : { ...before, quantity: before.quantity - 1 } };
}

function sameRecord(a: TrackerRecord | undefined, b: TrackerRecord) {
  return a && a.id === b.id && a.activityId === b.activityId && a.quantity === b.quantity
    && a.startedAt === b.startedAt && a.durationSeconds === b.durationSeconds && a.note === b.note && a.deleted === b.deleted;
}

export async function applyCountCorrection(plan: CountCorrection, port: CorrectionPort, reverse = false): Promise<void> {
  const from = reverse ? plan.after : plan.before, to = reverse ? plan.before : plan.after;
  const current = await port.read(from.id);
  // A previous response may have been lost after the server applied the operation.
  if (sameRecord(current, to)) return;
  if (!sameRecord(current, from)) throw new Error('记录已变化，请刷新后在详情中确认');
  if (from.deleted !== to.deleted) await port.deleted(to.id, to.deleted);
  else await port.editRecord(to.id, { quantity: to.quantity, startedAt: to.startedAt, durationSeconds: to.durationSeconds, note: to.note });
}
