import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const AUTH_STORAGE_KEY = "sb-kqddnrrbczrpmhnjdzmp-auth-token";

function clearStoredAuthSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(`${AUTH_STORAGE_KEY}-user`);
    window.localStorage.removeItem(`${AUTH_STORAGE_KEY}-code-verifier`);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(`${AUTH_STORAGE_KEY}-user`);
    window.sessionStorage.removeItem(`${AUTH_STORAGE_KEY}-code-verifier`);
  } catch (error) {
    console.warn("[auth] failed clearing stored session", error);
  }
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      // Invalidate router so protected routes re-evaluate auth (fixes Google OAuth redirect race)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        router.invalidate();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          setSession(null);
          setLoading(false);
          clearStoredAuthSession();
          try {
            await supabase.auth.signOut({ scope: "local" });
          } catch (error) {
            console.warn("[auth] signOut request failed after local cleanup", error);
          } finally {
            router.invalidate();
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
