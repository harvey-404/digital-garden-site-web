import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getLedgerMe } from '../api/ledger';
import { useAccount } from './AccountContext';
import type { LedgerMeVO } from '../types/ledger';
interface LedgerAuthState { token: string | null; me: LedgerMeVO | null; loading: boolean; error: string; isAuthenticated: boolean; onboardingDone: boolean; signOut: () => Promise<void>; refreshMe: () => Promise<void> }
const LedgerAuthContext = createContext<LedgerAuthState | undefined>(undefined);
export function LedgerAuthProvider({ children }: { children: ReactNode }) {
  const { account, loading: accountLoading, error: accountError, logout } = useAccount(); const { pathname } = useLocation();
  const active = pathname === '/ledger' || pathname.startsWith('/ledger/');
  const [me, setMe] = useState<LedgerMeVO | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const refreshMe = useCallback(async () => {
    if (!account || accountLoading || accountError) return;
    setLoading(true); setError('');
    try { setMe(await getLedgerMe()); }
    catch (e) { setError(e instanceof Error ? e.message : '无法读取账本'); throw e; }
    finally { setLoading(false); }
  }, [account, accountLoading, accountError]);
  useEffect(() => {
    if (!account) { setMe(null); return; }
    if (!active || pathname === '/ledger/login' || accountLoading || accountError) return;
    let cancelled = false; setLoading(true); setError('');
    getLedgerMe().then(data => { if (!cancelled) setMe(data); }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : '无法读取账本'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [account, active, pathname, accountLoading, accountError]);
  return <LedgerAuthContext.Provider value={{ token: account ? String(account.id) : null, me, loading: accountLoading || loading || Boolean(account && active && !me && !error && !accountError), error, isAuthenticated: Boolean(account), onboardingDone: me?.onboardingDone ?? false, signOut: logout, refreshMe }}>{children}</LedgerAuthContext.Provider>;
}
export function useLedgerAuth() { const context = useContext(LedgerAuthContext); if (!context) throw new Error('LedgerAuthProvider is required'); return context; }
