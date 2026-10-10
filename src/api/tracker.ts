import type { Activity, ActivityInput, Period, RecordInput, Timer, TrackerRecord, TrackerUser } from '../types/tracker';
import { RecordClock } from '../pages/tracker/recordClock';

const tokenKey = 'tracker_token';
export const trackerToken = () => localStorage.getItem(tokenKey);
export const saveTrackerToken = (token: string) => localStorage.setItem(tokenKey, token);
export const clearTrackerToken = () => localStorage.removeItem(tokenKey);
export const requestId = () => crypto.randomUUID();
const base = `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/tracker`;
const recordClock = new RecordClock();

async function call<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const token = trackerToken();
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  recordClock.observe(response.headers.get('Date'));
  let body: { code?: number; message?: string; data?: T };
  try { body = await response.json(); } catch { throw new Error('服务暂时没有响应，请稍后重试'); }
  if ((response.status === 401 || body.code === 401) && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) { clearTrackerToken(); window.dispatchEvent(new Event('tracker:unauthorized')); throw new Error('登录已过期，请重新登录'); }
  if (!response.ok || body.code !== 0) throw new Error(body.message || '请求失败，请重试');
  return body.data as T;
}

export const trackerApi = {
  recordTime: () => recordClock.now(),
  register: (username: string, password: string, timezone: string) => call<{ token: string; user: TrackerUser }>('/auth/register', 'POST', { username, password, timezone }),
  login: (username: string, password: string) => call<{ token: string; user: TrackerUser }>('/auth/login', 'POST', { username, password }),
  me: () => call<TrackerUser>('/auth/me'),
  timezone: (timezone: string) => call<TrackerUser>('/auth/me', 'PUT', { timezone }),
  activities: (date: string, period: Period, archived = false) => call<Activity[]>(`/activities?date=${date}&period=${period}&archived=${archived}`),
  createActivity: (data: ActivityInput) => call<Activity>('/activities', 'POST', data),
  editActivity: (id: number, data: Pick<ActivityInput, 'name' | 'unit' | 'rule'>) => call<Activity>(`/activities/${id}`, 'PUT', data),
  archive: (id: number, archived: boolean) => call<void>(`/activities/${id}/archive`, 'PATCH', { archived }),
  records: (id: number, date: string, period: Period) => call<TrackerRecord[]>(`/activities/${id}/records?date=${date}&period=${period}`),
  createRecord: (id: number, data: RecordInput) => call<TrackerRecord>(`/activities/${id}/records`, 'POST', data),
  editRecord: (id: number, data: RecordInput) => call<TrackerRecord>(`/records/${id}`, 'PUT', data),
  deleted: (id: number, deleted: boolean) => call<void>(`/records/${id}/deleted`, 'PATCH', { deleted }),
  timer: () => call<Timer | null>('/timer'),
  startTimer: (id: number, idempotencyKey: string = requestId()) => call<Timer>(`/activities/${id}/timer`, 'POST', { requestId: idempotencyKey }),
  timerAction: (id: number, action: 'pause' | 'resume' | 'finish' | 'cancel') => call<Timer | TrackerRecord | void>(`/timer/${id}/${action}`, 'POST'),
  natural: (text: string, idempotencyKey: string = requestId()) => call<{ status: 'CREATED' | 'CLARIFY'; message: string; activity: Activity | null }>('/goals/natural', 'POST', { requestId: idempotencyKey, text }),
};
