import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, ROLE_DASHBOARD_PATHS } from "../auth";
export default function ProtectedRoute({ allowedRole, children }) {
  const location = useLocation();
  const user = getCurrentUser();
  const hasToken = Boolean(
    localStorage.getItem("foodgo_access_token") ||
      localStorage.getItem("accessToken")
  );
  if (!user?.role || (!user.loggedIn && !hasToken)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={ROLE_DASHBOARD_PATHS[user.role] || "/"}
        replace
      />
    );
  }
  return children;
}
