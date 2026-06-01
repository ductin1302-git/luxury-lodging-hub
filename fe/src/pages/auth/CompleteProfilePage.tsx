import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/services/apiClient";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { User, Phone, ArrowRight, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const CompleteProfilePage = () => {
  const { user, updateProfile, setPassword } = useAuth();
  const { language } = useLocale();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const needsPassword = !user?.hasPassword;
  const copy =
    language === "en"
      ? {
          missing: "Please enter all required information",
          shortPassword: "Password must be at least 6 characters",
          mismatch: "Password confirmation does not match",
          setPasswordFailed: "Could not set your password.",
          success: "Profile updated successfully!",
          failed: "Could not update your profile.",
          title: "Complete your profile",
          subtitle: "Your Google account needs a dedicated password to protect your LuxStay account.",
          name: "Full name",
          namePlaceholder: "Your full name",
          phone: "Phone number",
          password: "Password",
          passwordPlaceholder: "Enter a new password",
          confirmPassword: "Confirm password",
          confirmPlaceholder: "Confirm your password",
          submit: "Complete",
          hidePassword: "Hide password",
          showPassword: "Show password",
        }
      : {
          missing: "Vui lòng nhập đầy đủ thông tin",
          shortPassword: "Mật khẩu phải có ít nhất 6 ký tự",
          mismatch: "Mật khẩu nhập lại không khớp",
          setPasswordFailed: "Không thể thiết lập mật khẩu.",
          success: "Cập nhật thông tin thành công!",
          failed: "Không thể cập nhật thông tin.",
          title: "Hoàn thiện hồ sơ",
          subtitle: "Tài khoản Google cần đặt mật khẩu riêng để bảo vệ tài khoản trên LuxStay.",
          name: "Họ và tên",
          namePlaceholder: "Nguyễn Văn A",
          phone: "Số điện thoại",
          password: "Mật khẩu",
          passwordPlaceholder: "Nhập mật khẩu mới",
          confirmPassword: "Nhập lại mật khẩu",
          confirmPlaceholder: "Nhập lại mật khẩu",
          submit: "Hoàn tất",
          hidePassword: "Ẩn mật khẩu",
          showPassword: "Hiện mật khẩu",
        };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      return toast.error(copy.missing);
    }

    if (needsPassword && password.length < 6) {
      return toast.error(copy.shortPassword);
    }

    if (needsPassword && password !== confirmPassword) {
      return toast.error(copy.mismatch);
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      updateProfile(updatedUser);

      if (needsPassword) {
        const ok = await setPassword(password, confirmPassword);
        if (!ok) {
          return toast.error(copy.setPasswordFailed);
        }
      }

      toast.success(copy.success);
      navigate("/");
    } catch (error) {
      console.error("Complete profile error", error);
      toast.error(copy.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-background">
      <Header />
      <div className="pt-32 pb-20 flex items-center justify-center px-4">
        <div className="w-full max-w-[480px]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-lg shadow-gold/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary-foreground dark:text-white">
              {copy.title}
            </h1>
            <p className="text-muted-foreground mt-2">
              {copy.subtitle}
            </p>
          </div>

          <div className="bg-white dark:bg-card rounded-3xl p-8 shadow-2xl border border-border/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold ml-1">{copy.name}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={copy.namePlaceholder}
                    className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold ml-1">{copy.phone}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="090 123 4567"
                    className="w-full pl-11 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                  />
                </div>
              </div>

              {needsPassword && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold ml-1">{copy.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        required
                        minLength={6}
                        placeholder={copy.passwordPlaceholder}
                        className="w-full pl-11 pr-12 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
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

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold ml-1">{copy.confirmPassword}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder={copy.confirmPlaceholder}
                        className="w-full pl-11 pr-12 py-3.5 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-gold"
                        aria-label={showConfirmPassword ? copy.hidePassword : copy.showPassword}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-gold text-primary font-bold py-4 rounded-2xl shadow-lg shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                ) : (
                  <>
                    {copy.submit}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompleteProfilePage;
