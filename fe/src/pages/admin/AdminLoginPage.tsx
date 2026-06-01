import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { getPortalStoredUser } from "@/services/authSession";

const ADMIN_REMEMBER_EMAIL_KEY = "admin_remember_email";

export default function AdminLoginPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout, user } = useAuth();
  const locationState = location.state as {
    from?: { pathname?: string; search?: string; hash?: string };
    prefillEmail?: string;
  } | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessEffect, setIsSuccessEffect] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const from = locationState?.from;
  const redirectPath =
    searchParams.get("returnTo") ||
    (from?.pathname ? `${from.pathname}${from.search || ""}${from.hash || ""}` : "/admin/dashboard");

  useEffect(() => {
    const savedEmail = locationState?.prefillEmail || localStorage.getItem(ADMIN_REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, [locationState]);

  useEffect(() => {
    if (searchParams.get("reason") === "timeout") {
      toast.error("Phiên quản trị đã hết hạn sau 5 phút không hoạt động.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && user.role === "admin" && !isSuccessEffect) {
      navigate(redirectPath, { replace: true });
    }
  }, [isSuccessEffect, navigate, redirectPath, user]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(email, password, "admin");

      if (!success) {
        toast.error("Email hoặc mật khẩu không đúng.");
        return;
      }

      const adminUser = getPortalStoredUser("admin");

      if (!adminUser || String(adminUser.role).toLowerCase() !== "admin") {
        toast.error("Tài khoản này không có quyền quản trị.");
        logout("admin");
        return;
      }

      if (rememberEmail) {
        localStorage.setItem(ADMIN_REMEMBER_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(ADMIN_REMEMBER_EMAIL_KEY);
      }

      setAdminName(adminUser.name || adminUser.fullName || "Admin");
      setIsSuccessEffect(true);

      window.setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1200);
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra khi đăng nhập.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-gold/30 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-gold to-yellow-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-gold/20 border border-gold/50">
            <ShieldAlert className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-3xl font-bold font-heading space-x-1 text-white tracking-tight">
            Quản Trị <span className="text-gold">Hệ Thống</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Đăng nhập cổng quản trị riêng cho Luxury Stay</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email quản trị</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-white placeholder-slate-500 shadow-inner"
                placeholder="admin@luxstay.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Mật khẩu bảo mật</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-11 pr-12 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-white placeholder-slate-500 shadow-inner"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(event) => setRememberEmail(event.target.checked)}
                  className="peer appearance-none w-5 h-5 border border-slate-700 rounded bg-slate-900/50 checked:bg-gold checked:border-gold transition-all cursor-pointer"
                />
                <div className="absolute opacity-0 peer-checked:opacity-100 text-slate-950 pointer-events-none transition-opacity">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Ghi nhớ email</span>
            </label>
            <button
              type="button"
              onClick={() => navigate("/auth?mode=forgot&context=admin&returnTo=/LoginAdmin/admin")}
              className="text-sm text-gold/80 hover:text-gold transition-colors"
            >
              Quên mật khẩu?
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-gold/30 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <span>Đăng Nhập Admin</span>
                )}
              </div>
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2026 Luxury Stay. Internal management portal.</p>
        </div>
      </div>

      {isSuccessEffect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-700">
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-700 delay-150 fill-mode-both">
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 rounded-full border-2 border-gold/10 luxury-orbit">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
              </div>
              <div className="absolute inset-4 rounded-full border border-gold/20 luxury-orbit [animation-direction:reverse] [animation-duration:5s]" />
              <div className="absolute inset-8 bg-gradient-to-tr from-gold to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] luxury-pulse">
                <ShieldAlert className="w-8 h-8 text-slate-950" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-4xl font-heading font-black text-white tracking-tighter">
                Xin chào, <span className="text-gold italic">{adminName}</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium tracking-wide">Đang mở không gian quản trị của bạn...</p>
            </div>

            <div className="mt-12 w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
              <div className="h-full bg-gradient-to-r from-gold/50 via-gold to-gold/50 rounded-full animate-[progress_1.2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
