import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { service } from '../data';
import type { SessionUser } from '../lib/types';

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
}

const AuthCtx = createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });

  useEffect(() => {
    let alive = true;
    service.getSession().then((user) => alive && setState({ user, ready: true }));
    const off = service.onAuthChange((user) =>
      setState((s) => (s.user?.id === user?.id && s.ready ? s : { user, ready: true })),
    );
    return () => {
      alive = false;
      off();
    };
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
