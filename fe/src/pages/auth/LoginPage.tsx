import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, Phone, Lock, User, ArrowRight, ShieldCheck, MailCheck, Eye, EyeOff } from "lucide-react";
import { BASE_URL } from "@/services/apiClient";
import { authService } from "@/services/authService";
import { getPortalStoredUser, isInternalRole } from "@/services/authSession";
import { useLocale } from "@/contexts/LocaleContext";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode");
  const authContext = searchParams.get("context");
  const [isLogin, setIsLogin] = useState(initialMode !== "register");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [forgotMode, setForgotMode] = useState(initialMode === "forgot");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout, requestPhoneOtp, verifyPhoneOtp, requestEmailOtp, verifyEmailOtp, completeRegister, user } = useAuth();
  const { language } = useLocale();

  const copy =
    language === "en"
      ? {
          resetTitle: "Reset password",
          loginTitle: "Sign in",
          registerTitle: "Create account",
          adminResetSubtitle: "Reset your internal account password and return to the admin portal",
          subtitle: "Sign in to manage your bookings and offers",
          phone: "Phone number",
          emailLabel: "Email address",
          accountEmail: "Account email",
          verificationCode: "Verification code",
          newPassword: "New password",
          confirmPassword: "Confirm password",
          password: "Password",
          sendCode: "Send code",
          resetPassword: "Reset password",
          backAdmin: "Back to admin portal",
          backLogin: "Back to sign in",
          finalStep: "Final step: complete your profile",
          fullNamePlaceholder: "Your full name",
          passwordPlaceholder: "At least 8 characters",
          repeatPassword: "Confirm password",
          forgotPassword: "Forgot password?",
          continue: "Continue",
          completeRegister: "Complete registration",
          otpLabel: "OTP verification code",
          verifyContinue: "Verify and continue",
          google: "Continue with Google",
          noAccount: "No LuxStay account yet?",
          hasAccount: "Already have a LuxStay account?",
          registerNow: "Register now",
          adminLogin: "Admin portal sign in",
          hidePassword: "Hide password",
          showPassword: "Show password",
          internalAccount: "Internal accounts must sign in through the admin portal.",
          loginSuccess: "Signed in successfully!",
          invalidLogin: "Email or password is incorrect.",
          codeSent: "Verification code sent!",
          emailExists: "Email already exists or the system is temporarily unavailable.",
          verified: "Verified successfully!",
          invalidCode: "The verification code is incorrect or has expired.",
          passwordMismatch: "Password confirmation does not match.",
          registerSuccess: "Account created successfully!",
          registerFailed: "Something went wrong while creating your account.",
          resetCodeSent: "A verification code has been sent if the email exists.",
          resetSuccess: "Password reset successfully. Please sign in.",
          requestFailed: "Could not process your request.",
          invalidPhone: "Please enter a valid phone number",
          otpSent: "OTP code sent!",
          otpFailed: "Could not send OTP. Please try again later.",
        }
      : {
          resetTitle: "Đặt lại mật khẩu",
          loginTitle: "Đăng nhập",
          registerTitle: "Tạo tài khoản",
          adminResetSubtitle: "Đặt lại mật khẩu cho tài khoản nội bộ và quay lại cổng quản trị",
          subtitle: "Đăng nhập để quản lý đặt phòng và ưu đãi của bạn",
          phone: "Số điện thoại",
          emailLabel: "Địa chỉ Email",
          accountEmail: "Email tài khoản",
          verificationCode: "Mã xác thực",
          newPassword: "Mật khẩu mới",
          confirmPassword: "Nhập lại mật khẩu",
          password: "Mật khẩu",
          sendCode: "Gửi mã",
          resetPassword: "Đặt lại mật khẩu",
          backAdmin: "Quay lại cổng quản trị",
          backLogin: "Quay lại đăng nhập",
          finalStep: "Bước cuối: Hoàn thiện thông tin",
          fullNamePlaceholder: "Họ và tên của bạn",
          passwordPlaceholder: "Mật khẩu ít nhất 8 ký tự",
          repeatPassword: "Nhập lại mật khẩu",
          forgotPassword: "Quên mật khẩu?",
          continue: "Tiếp tục",
          completeRegister: "Hoàn tất đăng ký",
          otpLabel: "Mã xác thực OTP",
          verifyContinue: "Xác nhận và tiếp tục",
          google: "Tiếp tục với Google",
          noAccount: "Chưa có tài khoản tại LuxStay?",
          hasAccount: "Đã có tài khoản tại LuxStay?",
          registerNow: "Đăng ký ngay",
          adminLogin: "Đăng nhập cổng quản trị",
          hidePassword: "Ẩn mật khẩu",
          showPassword: "Hiện mật khẩu",
          internalAccount: "Tài khoản nội bộ vui lòng đăng nhập tại cổng quản trị.",
          loginSuccess: "Đăng nhập thành công!",
          invalidLogin: "Email hoặc mật khẩu không đúng.",
          codeSent: "Đã gửi mã xác thực!",
          emailExists: "Email đã tồn tại hoặc hệ thống đang lỗi.",
          verified: "Xác thực thành công!",
          invalidCode: "Mã xác thực không đúng hoặc đã hết hạn.",
          passwordMismatch: "Mật khẩu nhập lại không khớp.",
          registerSuccess: "Tạo tài khoản thành công!",
          registerFailed: "Có lỗi xảy ra khi tạo tài khoản.",
          resetCodeSent: "Đã gửi mã xác thực nếu email tồn tại.",
          resetSuccess: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.",
          requestFailed: "Không thể xử lý yêu cầu.",
          invalidPhone: "Vui lòng nhập số điện thoại hợp lệ",
          otpSent: "Mã OTP đã được gửi!",
          otpFailed: "Không thể gửi OTP. Thử lại sau.",
        };

  const getRedirectPath = () => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo) return returnTo;

    const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
    if (!from?.pathname) return "/";

    return `${from.pathname}${from.search || ""}${from.hash || ""}`;
  };

  const resetTransientFields = () => {
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setResetPassword("");
    setResetConfirmPassword("");
  };

  const redirectInternalAccountToAdmin = (accountEmail?: string) => {
    logout("user");
    if (accountEmail) {
      localStorage.setItem("admin_remember_email", accountEmail);
    }
    toast.error(copy.internalAccount);
    navigate("/LoginAdmin/admin", {
      replace: true,
      state: accountEmail ? { prefillEmail: accountEmail } : undefined,
    });
  };

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (initialMode === "register") {
      setIsLogin(false);
      setForgotMode(false);
    } else if (initialMode === "forgot") {
      setIsLogin(true);
      setForgotMode(true);
    } else {
      setIsLogin(true);
      setForgotMode(false);
    }

    setRegisterStep(1);
    setForgotStep(1);
    setAuthMethod("email");
    setIsOtpSent(false);
    resetTransientFields();
  }, [initialMode]);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const ok = await login(email, password, "user");
        if (ok) {
          const loggedInUser = getPortalStoredUser("user");
          if (isInternalRole(loggedInUser?.role)) {
            redirectInternalAccountToAdmin(loggedInUser?.email || email);
            return;
          }
          toast.success(copy.loginSuccess);
          navigate(getRedirectPath(), { replace: true });
        } else {
          toast.error(copy.invalidLogin);
        }
        return;
      }

      if (registerStep === 1) {
        const res = await requestEmailOtp(email);
        if (res.success) {
          setRegisterStep(2);
          toast.success(res.message || copy.codeSent);
        } else {
          toast.error(res.message || copy.emailExists);
        }
        return;
      }

      if (registerStep === 2) {
        const res = await verifyEmailOtp(email, otp);
        if (res.success) {
          setRegisterStep(3);
          toast.success(copy.verified);
        } else {
          toast.error(copy.invalidCode);
        }
        return;
      }

      if (password !== confirmPassword) {
        toast.error(copy.passwordMismatch);
        return;
      }

      const ok = await completeRegister({
        email,
        otp,
        fullName: name,
        password,
        confirmPassword,
      }, "user");
      if (ok) {
        const registeredUser = getPortalStoredUser("user");
        if (isInternalRole(registeredUser?.role)) {
          redirectInternalAccountToAdmin(registeredUser?.email || email);
          return;
        }
        toast.success(copy.registerSuccess);
        navigate(getRedirectPath(), { replace: true });
      } else {
        toast.error(copy.registerFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (forgotStep === 1) {
        const res = await authService.requestPasswordReset(email);
        toast.success(res.message || copy.resetCodeSent);
        setForgotStep(2);
        return;
      }

      if (resetPassword !== resetConfirmPassword) {
        toast.error(copy.passwordMismatch);
        return;
      }

      await authService.resetPassword({
        email,
        otp,
        newPassword: resetPassword,
        confirmPassword: resetConfirmPassword,
      });
      toast.success(copy.resetSuccess);
      if (authContext === "admin") {
        navigate("/LoginAdmin/admin", { replace: true });
      } else {
        setForgotMode(false);
        setForgotStep(1);
        resetTransientFields();
      }
    } catch (error: any) {
      toast.error(error?.message || copy.requestFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return toast.error(copy.invalidPhone);
    }
    setIsSubmitting(true);
    const ok = await requestPhoneOtp(phoneNumber);
    setIsSubmitting(false);
    if (ok) {
      setIsOtpSent(true);
      toast.success(copy.otpSent);
    } else {
      toast.error(copy.otpFailed);
    }
  };

  const handlePhoneVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsSubmitting(true);
    const ok = await verifyPhoneOtp(phoneNumber, otp, "user");
    setIsSubmitting(false);
    if (ok) {
      const verifiedUser = getPortalStoredUser("user");
      if (isInternalRole(verifiedUser?.role)) {
        redirectInternalAccountToAdmin(verifiedUser?.email || undefined);
        return;
      }
      toast.success(copy.verified);
      navigate(getRedirectPath(), { replace: true });
    } else {
      toast.error(copy.invalidCode);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setForgotMode(false);
    setForgotStep(1);
    setRegisterStep(1);
    setIsOtpSent(false);
    resetTransientFields();
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-background">
      <Header />

      <div className="pt-32 pb-20 flex items-center justify-center px-4">
        <div className="w-full max-w-[520px]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-lg shadow-gold/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary-foreground dark:text-white">
              {forgotMode ? copy.resetTitle : isLogin ? copy.loginTitle : copy.registerTitle}
            </h1>
            <p className="text-muted-foreground mt-2">
              {authContext === "admin"
                ? copy.adminResetSubtitle
                : copy.subtitle}
            </p>
          </div>

          <div className="bg-white dark:bg-card rounded-3xl p-2 shadow-2xl border border-border/50">
            {!forgotMode && (
              <div className="flex bg-muted/50 rounded-2xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMethod("email"); setIsOtpSent(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${authMethod === "email" ? "bg-white dark:bg-primary shadow-md text-primary" : "text-muted-foreground hover:text-primary"}`}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${authMethod === "phone" ? "bg-white dark:bg-primary shadow-md text-primary" : "text-muted-foreground hover:text-primary"}`}
                >
                  <Phone className="w-4 h-4" /> {copy.phone}
                </button>
              </div>
            )}

            <div className="px-6 pb-6">
              {forgotMode ? (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold ml-1">{copy.accountEmail}</label>
                    <div className="relative">
                      <MailCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={forgotStep === 2}
                        placeholder="email@example.com"
                        className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all disabled:opacity-70"
                      />
                    </div>
                  </div>

                  {forgotStep === 2 && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold ml-1">{copy.verificationCode}</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          maxLength={6}
                          placeholder="000000"
                          className="w-full py-4 bg-muted/30 border border-border rounded-2xl text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold ml-1">{copy.newPassword}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="password"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder={copy.newPassword}
                            className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold ml-1">{copy.confirmPassword}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="password"
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder={copy.repeatPassword}
                            className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-gold text-primary font-bold py-4 rounded-2xl shadow-lg shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                  >
                    {isSubmitting ? <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span> : (
                      <>
                        {forgotStep === 1 ? copy.sendCode : copy.resetPassword}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (authContext === "admin") {
                        navigate("/LoginAdmin/admin", { replace: true });
                        return;
                      }
                      setForgotMode(false);
                      setForgotStep(1);
                      resetTransientFields();
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-gold transition-colors"
                  >
                    {authContext === "admin" ? copy.backAdmin : copy.backLogin}
                  </button>
                </form>
              ) : authMethod === "email" ? (
                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  {(isLogin || (!isLogin && registerStep === 1)) && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold ml-1">{copy.emailLabel}</label>
                      <div className="relative">
                        <MailCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="email@example.com"
                          className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {!isLogin && registerStep === 2 && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                      <label className="text-sm font-semibold ml-1 text-center block">{copy.verificationCode} {email}</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        placeholder="000000"
                        maxLength={6}
                        className="w-full py-4 bg-muted/30 border border-border rounded-2xl text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-gold outline-none"
                      />
                    </div>
                  )}

                  {!isLogin && registerStep === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold ml-1 text-gold">{copy.finalStep}</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder={copy.fullNamePlaceholder}
                            className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold ml-1">{copy.password}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder={copy.passwordPlaceholder}
                            className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold ml-1">{copy.confirmPassword}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder={copy.repeatPassword}
                            className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isLogin && (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold ml-1">{copy.password}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="********"
                            className="w-full pl-11 pr-12 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-gold"
                            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end px-1">
                        <button
                          type="button"
                          onClick={() => { setForgotMode(true); setForgotStep(1); setAuthMethod("email"); resetTransientFields(); }}
                          className="text-xs text-gold hover:underline"
                        >
                          {copy.forgotPassword}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-gold text-primary font-bold py-4 rounded-2xl shadow-lg shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                  >
                    {isSubmitting ? <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span> : (
                      <>
                        {isLogin ? copy.loginTitle : registerStep === 1 ? copy.sendCode : registerStep === 2 ? copy.continue : copy.completeRegister}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePhoneVerify} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold ml-1">{copy.phone}</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          placeholder="090 123 4567"
                          disabled={isOtpSent}
                          className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all disabled:opacity-60"
                        />
                      </div>
                      {!isOtpSent && (
                        <button type="button" onClick={handleSendOtp} disabled={isSubmitting} className="bg-primary text-white px-4 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors whitespace-nowrap">
                          {copy.sendCode}
                        </button>
                      )}
                    </div>
                  </div>

                  {isOtpSent && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-sm font-semibold ml-1">{copy.otpLabel}</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        placeholder="123456"
                        maxLength={6}
                        className="w-full py-3.5 bg-muted/30 border border-border rounded-2xl text-center text-lg font-bold tracking-[0.5em] focus:ring-2 focus:ring-gold outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isOtpSent || isSubmitting}
                    className="w-full bg-gradient-gold text-primary font-bold py-4 rounded-2xl shadow-lg shadow-gold/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {isSubmitting ? <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></span> : copy.verifyContinue}
                  </button>
                </form>
              )}

              {!forgotMode && (
                <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = BASE_URL + "/api/auth/google";
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-card border border-border rounded-2xl text-sm font-semibold hover:bg-muted/50 transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {copy.google}
                  </button>

                  <p className="text-sm text-muted-foreground text-center">
                    {isLogin ? copy.noAccount : copy.hasAccount}
                    <button onClick={switchMode} className="text-gold font-bold ml-1.5 hover:underline">
                      {isLogin ? copy.registerNow : copy.loginTitle}
                    </button>
                  </p>
                  <Link to="/LoginAdmin/admin" className="text-xs text-muted-foreground hover:text-gold transition-colors">
                    {copy.adminLogin}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
