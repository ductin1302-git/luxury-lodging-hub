import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPortalAccessToken, getPortalStoredUser } from "@/services/authSession";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const cachedAdminUser = getPortalStoredUser("admin");
  const hasCachedAdminSession =
    Boolean(getPortalAccessToken("admin")) &&
    String(cachedAdminUser?.role || "").toLowerCase() === "admin";
  const normalizedRole = String(user?.role || "").toLowerCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasCachedAdminSession && normalizedRole !== "admin") {
    return <>{children}</>;
  }

  // If not logged in, or not an admin, redirect to admin login
  if (!user || normalizedRole !== "admin") {
    return <Navigate to="/LoginAdmin/admin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
