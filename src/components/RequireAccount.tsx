import { Navigate, Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAccount } from '../context/AccountContext';
import Spinner from './Spinner';
export default function RequireAccount({ children }: { children: ReactNode }) {
  const { account, loading, error, refresh } = useAccount(); const location = useLocation();
  if (loading) return <Spinner />;
  if (error) return <section className="account-card"><h1>请先确认原账号数据</h1><p role="alert">{error}</p><Link to="/account">前往账号中心</Link><button onClick={() => void refresh()}>重试绑定</button></section>;
  if (!account) return <Navigate replace to={`/login?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`} />;
  return <>{children}</>;
}
