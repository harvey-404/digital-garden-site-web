export type Period = 'DAY' | 'WEEK';
export type Metric = 'COUNT' | 'DURATION';
export type Direction = 'MAX' | 'MIN';
export interface Rule { id: number; period: Period | null; metric: Metric | null; direction: Direction | null; target: number; sessionDirection: Direction | null; sessionSeconds: number | null; effectiveFrom: string }
export interface Summary { periodStart: string; periodEnd: string; count: number; qualifiedCount: number; durationSeconds: number; sessionExceeded: number; maxSessionSeconds: number; goalValue: number | null; remaining: number | null; excess: number; status: 'EMPTY' | 'TRACKING' | 'WITHIN' | 'AT_LIMIT' | 'DONE' | 'OVER'; rule: Rule | null }
export interface Activity { id: number; name: string; unit: string; template: string; trackDuration: boolean; archived: boolean; rules: Rule[]; summary: Summary }
export interface TrackerRecord { id: number; activityId: number; quantity: number; startedAt: string; durationSeconds: number; note: string; deleted: boolean }
export interface Timer { id: number; activityId: number; startedAt: string; runningSince: string | null; elapsedSeconds: number; state: 'RUNNING' | 'PAUSED' }
export interface TrackerUser { id: number; username: string; timezone: string }
export interface RuleInput { period: Period; metric: Metric; direction: Direction; target: number; sessionDirection: Direction | null; sessionSeconds: number | null }
export interface ActivityInput { requestId: string; name: string; unit: string; template: string; trackDuration: boolean; rule: RuleInput | null }
export interface RecordInput { requestId?: string; quantity: number; startedAt: string; durationSeconds: number; note: string }
