import type { Direction, Metric, Rule, Summary, TrackerRecord } from '../../types/tracker.ts';

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (!s) return '0秒';
  const hours = Math.floor(s / 3600), mins = Math.floor(s % 3600 / 60), rest = s % 60;
  return `${hours ? `${hours}小时` : ''}${mins ? `${mins}分` : ''}${rest ? `${rest}秒` : ''}`;
}

export function periodLabel(start: string, endExclusive: string): string {
  const end = new Date(`${endExclusive}T12:00:00Z`); end.setUTCDate(end.getUTCDate() - 1);
  const short = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;
  return `${short(start)} - ${short(end.toISOString().slice(0, 10))}`;
}

export function requestedPeriodLabel(date: string, period: 'DAY' | 'WEEK'): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (period === 'WEEK') d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const start = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() + (period === 'WEEK' ? 7 : 1));
  return periodLabel(start, d.toISOString().slice(0, 10));
}

export function ruleText(rule: Pick<Rule, 'period' | 'metric' | 'direction' | 'target' | 'sessionDirection' | 'sessionSeconds' | 'effectiveFrom'> | null, includeDate = true, countUnit = '次'): string {
  if (!rule) return '仅统计';
  const date = includeDate ? `${Number(rule.effectiveFrom.slice(5, 7))}月${Number(rule.effectiveFrom.slice(8, 10))}日起 · ` : '';
  if (!rule.period || !rule.metric || !rule.direction) return `${date}仅统计`;
  const base = `${rule.period === 'DAY' ? '每天' : '每周'}${rule.direction === 'MIN' ? '至少' : '最多'}${rule.metric === 'COUNT' ? `${rule.target}${countUnit}` : formatDuration(rule.target)}`;
  return `${date}${base}${rule.sessionDirection && rule.sessionSeconds ? ` · 每次${rule.sessionDirection === 'MIN' ? '至少' : '最多'}${formatDuration(rule.sessionSeconds)}` : ''}`;
}

export function progressText(summary: Pick<Summary, 'count' | 'qualifiedCount' | 'durationSeconds' | 'rule'>, countUnit = '次'): string {
  const r = summary.rule;
  if (!r?.metric || !r.direction) return `${summary.count} ${countUnit} · ${formatDuration(summary.durationSeconds)}`;
  if (r.metric === 'DURATION') return `${formatDuration(summary.durationSeconds)} / ${formatDuration(r.target)}`;
  return `${r.direction === 'MIN' ? summary.qualifiedCount : summary.count} / ${r.target} ${countUnit}`;
}

export function progressLabel(summary: Pick<Summary, 'rule' | 'status' | 'remaining' | 'excess' | 'sessionExceeded'>, countUnit = '次'): string {
  const r = summary.rule;
  if (!r?.metric || !r.direction) return '仅统计';
  if (summary.status === 'DONE') return '目标已达成';
  const unit = (value: number) => r.metric === 'DURATION' ? formatDuration(value) : `${value}${countUnit}`;
  const periodic = summary.excess > 0 ? `周期超出${unit(summary.excess)}` : summary.status === 'AT_LIMIT' ? '已达上限' : `${r.direction === 'MIN' ? '还差' : '剩余'}${unit(summary.remaining ?? 0)}`;
  return summary.sessionExceeded > 0 ? `${periodic} · ${summary.sessionExceeded}次单次时长超限` : periodic;
}

export function statusText(status: Summary['status']): string {
  return ({ EMPTY: '尚未记录', TRACKING: '进行中', WITHIN: '额度内', AT_LIMIT: '已达上限', DONE: '已达成', OVER: '已超出' })[status];
}

export function localDisplay(iso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  const value = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
}

export function toUtc(local: string, timezone: string): string {
  const desired = Date.parse(`${local}:00Z`);
  let instant = desired;
  for (let i = 0; i < 3; i++) {
    const shown = localDisplay(new Date(instant).toISOString(), timezone);
    const diff = desired - Date.parse(`${shown}:00Z`);
    instant += diff;
    if (!diff) break;
  }
  const result = new Date(instant).toISOString();
  if (localDisplay(result, timezone) !== local) throw new Error('这个本地时间在账户时区中不存在，请选择其他时间');
  return result;
}

export function timerElapsed(timer: { elapsedSeconds: number; state: 'RUNNING' | 'PAUSED' }, syncedAt: number, now: number): number {
  return timer.elapsedSeconds + (timer.state === 'RUNNING' ? Math.max(0, Math.floor((now - syncedAt) / 1000)) : 0);
}

export function visibleHistoryRecords<T>(currentKey: string, loadedKey: string, records: T[]): T[] {
  return currentKey === loadedKey ? records : [];
}

export function retryRequestId(previous: { payload: string; id: string } | null, payload: string, next = () => crypto.randomUUID()): { payload: string; id: string } {
  return previous?.payload === payload ? previous : { payload, id: next() };
}

export function recordEditPayload(original: Pick<TrackerRecord, 'quantity' | 'startedAt' | 'durationSeconds' | 'note'>, form: { quantity: number; startDisplay: string; initialStartDisplay: string; durationMinutes: string; initialDurationMinutes: string; note: string }, timezone: string) {
  return { quantity: form.quantity, startedAt: form.startDisplay === form.initialStartDisplay ? original.startedAt : toUtc(form.startDisplay, timezone), durationSeconds: form.durationMinutes === form.initialDurationMinutes ? original.durationSeconds : Math.round(Number(form.durationMinutes) * 60), note: form.note };
}

export function goalValue(summary: Summary): number { const r = summary.rule; if (!r?.metric || !r.direction) return 0; return r.metric === 'DURATION' ? summary.durationSeconds : r.direction === 'MIN' ? summary.qualifiedCount : summary.count; }
export function thresholdKind(direction: Direction | null, metric: Metric | null) { return direction === 'MAX' ? '额度' : metric === 'COUNT' ? '目标' : '时长目标'; }
