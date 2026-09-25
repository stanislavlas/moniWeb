import { Navigate } from "react-router-dom";

export function PrivateRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
