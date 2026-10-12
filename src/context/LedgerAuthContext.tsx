import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getLedgerMe } from '../api/ledger';
import { ledgerFetch } from '../api/ledgerClient';
import { useAccount } from './AccountContext';
import type { LedgerMeVO } from '../types/ledger';
import type { LedgerGuestStatus } from '../types/ledgerChat';
interface LedgerAuthState { token: string | null; me: LedgerMeVO | null; guest: LedgerGuestStatus | null; loading: boolean; error: string; isAuthenticated: boolean; onboardingDone: boolean; signOut: () => Promise<void>; refreshMe: () => Promise<void> }
const LedgerAuthContext = createContext<LedgerAuthState | undefined>(undefined);
export function LedgerAuthProvider({ children }: { children: ReactNode }) {
  const { account, loading: accountLoading, error: accountError, logout } = useAccount(); const { pathname } = useLocation();
  const active = pathname === '/ledger' || pathname.startsWith('/ledger/');
  const chat = /^\/ledger\/chat\/?$/.test(pathname);
  const [guest, setGuest] = useState<LedgerGuestStatus | null>(null);
  const [me, setMe] = useState<LedgerMeVO | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const refreshMe = useCallback(async () => {
    if (accountLoading || accountError || (!account && !chat)) return;
    setLoading(true); setError('');
    try { if (account) { setMe(await getLedgerMe()); setGuest(null); } else { setMe(null); setGuest(await ledgerFetch<LedgerGuestStatus>('/chat/session')); } }
    catch (e) { setError(e instanceof Error ? e.message : '无法读取账本'); throw e; }
    finally { setLoading(false); }
  }, [account, accountLoading, accountError, chat]);
  useEffect(() => {
    setMe(null); setGuest(null); setError('');
    if (!active || pathname === '/ledger/login' || accountLoading || accountError || (!account && !chat)) return;
    let cancelled = false; setLoading(true); setError('');
    const request = account ? getLedgerMe() : ledgerFetch<LedgerGuestStatus>('/chat/session');
    request.then(data => { if (!cancelled) { if (account) setMe(data as LedgerMeVO); else setGuest(data as LedgerGuestStatus); } }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : '无法读取账本'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [account, active, pathname, accountLoading, accountError, chat]);
  return <LedgerAuthContext.Provider value={{ token: account ? String(account.id) : guest?.isGuest ? 'guest' : null, me, guest, loading: accountLoading || loading || Boolean(active && ((account && !me) || (!account && chat && !guest)) && !error && !accountError), error: accountError || error, isAuthenticated: Boolean(account), onboardingDone: me?.onboardingDone ?? false, signOut: logout, refreshMe }}>{children}</LedgerAuthContext.Provider>;
}
export function useLedgerAuth() { const context = useContext(LedgerAuthContext); if (!context) throw new Error('LedgerAuthProvider is required'); return context; }
