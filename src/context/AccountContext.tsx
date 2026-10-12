import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { accountRequest, accountSignal, type Account } from '../api/account';
interface State { account: Account | null; loading: boolean; error: string; refresh: () => Promise<void>; authenticate: (path: 'login' | 'register', data: unknown) => Promise<boolean>; logout: () => Promise<void> }
const Context = createContext<State | undefined>(undefined);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const pending = useRef<Promise<void> | null>(null);
  const adopt = useCallback(async (user: Account) => {
    setAccount(user); setError('');
    for (const module of ['ledger', 'tracker'] as const) {
      const key = `${module}_token`, token = localStorage.getItem(key);
      if (token) {
        try { await accountRequest(`/links/${module}`, { token }); if (localStorage.getItem(key) === token) localStorage.removeItem(key); user = { ...user, links: { ...user.links, [module]: true } }; setAccount(user); }
        catch (e) { setError(`旧${module === 'ledger' ? '账本' : '打卡'}数据绑定未完成：${e instanceof Error ? e.message : '请重试'}。原登录凭证已保留，请在账号中心处理后再进入工具。`); return false; }
      }
    }
    return true;
  }, []);
  const refresh = useCallback(async () => {
    if (pending.current) return pending.current;
    const job = (async () => { setLoading(true); try { await adopt(await accountRequest<Account>('/me')); } catch (e) { if ((e as { status?: number; code?: number }).status === 401 || (e as { code?: number }).code === 401) { setAccount(null); setError(''); } else setError(e instanceof Error ? e.message : '无法验证账号'); } finally { setLoading(false); } })();
    pending.current = job; try { await job; } finally { pending.current = null; }
  }, [adopt]);
  useEffect(() => { void refresh(); const focus = () => { void refresh(); }; const storage = (e: StorageEvent) => { if (e.key === 'dg_account_changed') void refresh(); }; window.addEventListener('focus', focus); window.addEventListener('storage', storage); window.addEventListener('account:changed', focus); return () => { window.removeEventListener('focus', focus); window.removeEventListener('storage', storage); window.removeEventListener('account:changed', focus); }; }, [refresh]);
  const authenticate = async (path: 'login' | 'register', data: unknown) => { setLoading(true); try { const ok = await adopt(await accountRequest<Account>(`/${path}`, data)); localStorage.setItem('dg_account_changed', String(Date.now())); return ok; } finally { setLoading(false); } };
  const logout = async () => { await accountRequest('/logout', {}); localStorage.removeItem('ledger_token'); localStorage.removeItem('tracker_token'); setAccount(null); setError(''); accountSignal(); };
  return <Context.Provider value={{ account, loading, error, refresh, authenticate, logout }}>{children}</Context.Provider>;
}
export function useAccount() { const context = useContext(Context); if (!context) throw new Error('AccountProvider is required'); return context; }
