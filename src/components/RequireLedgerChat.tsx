import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLedgerAuth } from '../context/LedgerAuthContext';
import Spinner from './Spinner';
export default function RequireLedgerChat({ children }: { children: ReactNode }) {
  const { loading, error, refreshMe, isAuthenticated, guest } = useLedgerAuth();
  if (loading) return <Spinner />;
  if (error || (!isAuthenticated && !guest?.isGuest)) return <section><p role="alert">{error || '无法读取游客会话'}</p><button onClick={() => void refreshMe().catch(() => {})}>重试</button> <Link to="/login?next=%2Fledger%2Fchat">登录</Link> <Link to="/register?next=%2Fledger%2Fchat">注册</Link></section>;
  return <>{children}</>;
}
