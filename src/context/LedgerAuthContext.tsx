import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getLedgerMe } from "../api/ledger";
import { clearLedgerToken, getLedgerToken, setLedgerToken } from "../api/ledgerClient";
import type { LedgerMeVO } from "../types/ledger";

interface LedgerAuthState {
  token: string | null;
  me: LedgerMeVO | null;
  loading: boolean;
  isAuthenticated: boolean;
  onboardingDone: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
  refreshMe: () => Promise<void>;
}

const LedgerAuthContext = createContext<LedgerAuthState | undefined>(undefined);

export function LedgerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getLedgerToken());
  const [me, setMe] = useState<LedgerMeVO | null>(null);
  const [loading, setLoading] = useState(() => !!getLedgerToken());

  const refreshMe = useCallback(async () => {
    const current = getLedgerToken();
    if (!current) {
      setMe(null);
      return;
    }
    const data = await getLedgerMe();
    setMe(data);
  }, []);

  useEffect(() => {
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getLedgerMe()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) {
          clearLedgerToken();
          setToken(null);
          setMe(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const signIn = (t: string) => {
    setLedgerToken(t);
    setToken(t);
  };

  const signOut = () => {
    clearLedgerToken();
    setToken(null);
    setMe(null);
  };

  return (
    <LedgerAuthContext.Provider
      value={{
        token,
        me,
        loading,
        isAuthenticated: !!token,
        onboardingDone: me?.onboardingDone ?? false,
        signIn,
        signOut,
        refreshMe,
      }}
    >
      {children}
    </LedgerAuthContext.Provider>
  );
}

export function useLedgerAuth(): LedgerAuthState {
  const ctx = useContext(LedgerAuthContext);
  if (!ctx) throw new Error("useLedgerAuth 必须在 LedgerAuthProvider 内使用");
  return ctx;
}
