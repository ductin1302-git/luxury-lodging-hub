import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { authService } from "@/services/authService";
import { clearPortalSession, isInternalRole, setPortalSession } from "@/services/authSession";

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenAndUser } = useAuth();
  const { language } = useLocale();
  const copy =
    language === "en"
      ? {
          missingToken: "Authentication failed!",
          internalAccount: "Internal accounts must sign in through the admin portal.",
          success: "Signed in with Google successfully!",
          failed: "Something went wrong while verifying Google sign-in.",
          loading: "Verifying with Google...",
        }
      : {
          missingToken: "Xác thực thất bại!",
          internalAccount: "Tài khoản nội bộ vui lòng đăng nhập tại cổng quản trị.",
          success: "Đăng nhập Google thành công!",
          failed: "Có lỗi xảy ra khi xác thực Google.",
          loading: "Đang xác thực với Google...",
        };

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("accessToken");
      if (!token) {
        toast.error(copy.missingToken);
        navigate("/auth");
        return;
      }

      try {
        setPortalSession("user", token, null);

        const user = await authService.getMe();
        setTokenAndUser(token, user, "user");

        if (isInternalRole(user?.role)) {
          clearPortalSession("user");
          localStorage.setItem("admin_remember_email", user?.email || "");
          toast.error(copy.internalAccount);
          navigate("/LoginAdmin/admin", {
            replace: true,
            state: user?.email ? { prefillEmail: user.email } : undefined,
          });
          return;
        }

        toast.success(copy.success);

        if (!user.hasPassword || !user.phone || user.name === "Google User") {
          navigate("/complete-profile", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Google auth callback error", error);
        clearPortalSession("user");
        toast.error(copy.failed);
        navigate("/auth", { replace: true });
      }
    };

    handleCallback();
  }, [copy.failed, copy.internalAccount, copy.missingToken, copy.success, navigate, searchParams, setTokenAndUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground animate-pulse">{copy.loading}</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
