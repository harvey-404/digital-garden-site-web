import { createContext, useContext, useState, type ReactNode } from "react";
import { TOKEN_KEY } from "../api/client";

interface AuthState {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  signIn: (token: string, username: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const USERNAME_KEY = "dg_username";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY));

  const signIn = (t: string, u: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USERNAME_KEY, u);
    setToken(t);
    setUsername(u);
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated: !!token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
