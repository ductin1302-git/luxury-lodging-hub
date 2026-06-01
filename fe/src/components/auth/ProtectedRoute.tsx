import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPortalAccessToken, getPortalStoredUser, resolveAuthPortal } from "@/services/authSession";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("customer" | "admin" | "staff")[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const portal = resolveAuthPortal(location.pathname);
  const cachedUser = getPortalStoredUser(portal);
  const hasCachedSession = Boolean(getPortalAccessToken(portal)) && Boolean(cachedUser);
  const effectiveUser = user || cachedUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!effectiveUser && !hasCachedSession) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const normalizedRole = String(effectiveUser?.role || "").toLowerCase() as "customer" | "admin" | "staff";

  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
