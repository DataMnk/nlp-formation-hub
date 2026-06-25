import { createContext, useContext } from "react";

type RoleContextValue = {
  role: string | null;
  isLoading: boolean;
};

export const RoleContext = createContext<RoleContextValue>({
  role: null,
  isLoading: true,
});

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
