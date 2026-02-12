import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage.tsx";
import SignInPage from "../pages/auth/SignInPage.tsx";
import SignUpPage from "../pages/auth/SignUpPage.tsx";
import NotFoundPage from "../pages/404Page.tsx";
import AuthProtectedRoute from "./AuthProtectedRoute.tsx";
import AdminRoute from "./AdminRoute.tsx";
import MemberRoute from "./MemberRoute.tsx";
import AdminDashboardPage from "../pages/AdminDashboardPage.tsx";
import MemberDashboardPage from "../pages/MemberDashboardPage.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";
import Providers from "../Providers.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Providers />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/auth/sign-in",
        element: <SignInPage />,
      },
      {
        path: "/auth/sign-up",
        element: <SignUpPage />,
      },
      {
        path: "/",
        element: <AuthProtectedRoute />,
        children: [
          {
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "/admin",
            element: <AdminRoute />,
            children: [{ index: true, element: <AdminDashboardPage /> }],
          },
          {
            path: "/member",
            element: <MemberRoute />,
            children: [{ index: true, element: <MemberDashboardPage /> }],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
