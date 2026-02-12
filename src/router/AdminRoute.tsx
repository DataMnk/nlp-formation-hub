import { Navigate, Outlet } from "react-router-dom";
import { useRole } from "../context/RoleContext";

const AdminRoute = () => {
  const { role } = useRole();
  if (role !== "admin") {
    return <Navigate to="/member" replace />;
  }
  return <Outlet />;
};

export default AdminRoute;
