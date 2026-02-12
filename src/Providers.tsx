import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { RoleProvider } from "./context/RoleContext";

const Providers = () => {
  return (
    <SessionProvider>
      <RoleProvider>
        <Outlet />
      </RoleProvider>
    </SessionProvider>
  );
};

export default Providers;
