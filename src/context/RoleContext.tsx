import { useEffect, useState } from "react";
import supabase from "../supabase";
import LoadingPage from "../pages/LoadingPage";
import { useSession } from "./useSession";
import { RoleContext } from "./useRole";

type Props = { children: React.ReactNode };

export const RoleProvider = ({ children }: Props) => {
  const { session } = useSession();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    if (!userId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setRole(null);
      } else {
        setRole((data?.role as string) ?? null);
      }
      setIsLoading(false);
    };

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const value = { role, isLoading };

  return (
    <RoleContext.Provider value={value}>
      {isLoading ? <LoadingPage /> : children}
    </RoleContext.Provider>
  );
};
