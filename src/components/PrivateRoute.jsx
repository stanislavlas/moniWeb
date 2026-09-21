import { Navigate } from "react-router-dom";

export function PrivateRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
