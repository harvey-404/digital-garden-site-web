import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useLedgerAuth } from "../context/LedgerAuthContext";
import Spinner from "./Spinner";

export default function RequireLedgerAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, onboardingDone, loading } = useLedgerAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/ledger/login" state={{ from: location }} replace />;
  }

  if (!onboardingDone) {
    return <Navigate to="/ledger/onboarding" replace />;
  }

  return <>{children}</>;
}
