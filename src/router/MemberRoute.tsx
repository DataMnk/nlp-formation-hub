import { Navigate, Outlet } from "react-router-dom";
import { useRole } from "../context/RoleContext";

const MemberRoute = () => {
  const { role } = useRole();
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
};

export default MemberRoute;
