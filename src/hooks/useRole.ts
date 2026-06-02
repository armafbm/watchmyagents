import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRole(role: string) {
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) {
        if (!cancelled) setHasRole(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", role as never)
        .maybeSingle();
      if (!cancelled) setHasRole(!error && !!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  return hasRole;
}
