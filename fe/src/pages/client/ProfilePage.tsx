import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BadgeCheck,
  BedDouble,
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Languages,
  Loader2,
  Mail,
  MessageSquareHeart,
  Phone,
  Receipt,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import ScrollReveal from "@/components/common/ScrollReveal";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { interpolate, useLocale } from "@/contexts/LocaleContext";
import { useFavoriteHotels } from "@/hooks/useFavoriteHotels";
import { apiFetch } from "@/services/apiClient";
import { authService } from "@/services/authService";
import {
  canReviewBooking,
  getLocalBookingReview,
  getPendingReviewBookings,
  REVIEWS_CHANGED_EVENT,
} from "@/services/reviewService";
import { getAvatarInitial } from "@/utils/user";

type SettingsTab = "profile" | "password" | "preferences";

const formatDate = (value?: string, language: "vi" | "en" = "vi") =>
  value
    ? new Date(value).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "---";

const statusCopy: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "border-amber-200 bg-amber-50 text-amber-700" },
  confirmed: { label: "Đã xác nhận", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  checked_in: { label: "Đang lưu trú", className: "border-blue-200 bg-blue-50 text-blue-700" },
  checked_out: { label: "Đã hoàn tất", className: "border-slate-200 bg-slate-100 text-slate-700" },
  cancelled: { label: "Đã hủy", className: "border-red-200 bg-red-50 text-red-700" },
};

const paymentCopy: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ thanh toán", className: "border-amber-200 bg-amber-50 text-amber-700" },
  paid: { label: "Đã thanh toán", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failed: { label: "Thanh toán lỗi", className: "border-red-200 bg-red-50 text-red-700" },
  refunded: { label: "Đã hoàn tiền", className: "border-slate-200 bg-slate-100 text-slate-700" },
};

const getBadge = (map: typeof statusCopy, value?: string) => {
  const key = String(value || "pending").toLowerCase();
  return map[key] || { label: value || "---", className: "border-border bg-muted text-muted-foreground" };
};

const getRoomName = (booking: any, language: "vi" | "en") =>
  booking.items?.[0]?.roomNameSnapshot ||
  booking.items?.[0]?.room?.name ||
  booking.roomName ||
  (language === "en" ? "Booked room" : "Phòng đã đặt");

const getHotelName = (booking: any, language: "vi" | "en") =>
  booking.hotel?.name || booking.hotelNameSnapshot || booking.hotelName || (language === "en" ? "Hotel" : "Khách sạn");

const ProfilePage = () => {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const { currency, formatCurrency, language, t } = useLocale();
  const { favoriteIds } = useFavoriteHotels();
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [reviewVersion, setReviewVersion] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("luxury_profile_preferences");
    try {
      return saved
        ? JSON.parse(saved)
        : {
            emailUpdates: true,
            bookingReminders: true,
            compactBookings: false,
            language: "vi",
            currency: "VND",
          };
    } catch {
      return {
        emailUpdates: true,
        bookingReminders: true,
        compactBookings: false,
        language: "vi",
        currency: "VND",
      };
    }
  });

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  useEffect(() => {
    localStorage.setItem("luxury_profile_preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (authLoading || !user) return;

    setBookingsLoading(true);
    apiFetch("/bookings/my-bookings")
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        if (err?.status !== 401) {
          toast.error(language === "en" ? "Could not load booking history" : "Không thể tải lịch sử booking");
        }
      })
      .finally(() => setBookingsLoading(false));
  }, [authLoading, language, user]);

  useEffect(() => {
    const handleReviewChange = () => setReviewVersion((value) => value + 1);
    window.addEventListener(REVIEWS_CHANGED_EVENT, handleReviewChange);
    window.addEventListener("storage", handleReviewChange);

    return () => {
      window.removeEventListener(REVIEWS_CHANGED_EVENT, handleReviewChange);
      window.removeEventListener("storage", handleReviewChange);
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const activeBookings = bookings.filter((item) => item.status !== "cancelled");
    const paidBookings = bookings.filter((item) => item.paymentStatus === "paid");
    const upcomingBookings = activeBookings.filter((item) => item.checkIn && new Date(item.checkIn) >= now);
    const totalSpent = paidBookings.reduce((sum, item) => sum + Number(item.payment?.amount || item.total || 0), 0);
    const latestBooking = bookings[0];
    const completedCount = bookings.filter((item) => item.status === "checked_out").length;
    const pendingReviewBookings = getPendingReviewBookings(bookings);
    const reviewedCount = bookings.filter((item) => getLocalBookingReview(item.id)).length;

    return {
      total: bookings.length,
      active: activeBookings.length,
      paid: paidBookings.length,
      upcoming: upcomingBookings.length,
      totalSpent,
      latestBooking,
      completedCount,
      pendingReviewBookings,
      pendingReviews: pendingReviewBookings.length,
      reviewedCount,
      memberTier: totalSpent >= 50000000 || completedCount >= 5 ? "Gold" : totalSpent >= 15000000 ? "Silver" : "Member",
    };
  }, [bookings, reviewVersion]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const avatarInitial = getAvatarInitial(user);
  const providerLabel = user.authProvider === "google" ? "Google" : "Email";
  const passwordLabel = user.hasPassword ? t("settings.hasPassword") : t("settings.noPassword");
  const bookingPreview = preferences.compactBookings ? bookings.slice(0, 4) : bookings.slice(0, 6);
  const profileCopy =
    language === "en"
      ? {
          pendingReviews: "Pending reviews",
          reviewPromptTitle: "Your completed stays are ready for review",
          reviewPromptDesc: "Share photos and star ratings so other guests can choose with more confidence.",
          writeReview: "Write review",
          reviewed: "Reviewed",
          reviewPending: "Awaiting review",
        }
      : {
          pendingReviews: "Chờ đánh giá",
          reviewPromptTitle: "Các kỳ lưu trú đã hoàn tất đang chờ bạn đánh giá",
          reviewPromptDesc: "Chia sẻ hình ảnh và số sao để giúp khách khác chọn khách sạn tự tin hơn.",
          writeReview: "Đánh giá",
          reviewed: "Đã đánh giá",
          reviewPending: "Chờ đánh giá",
        };

  const openSettings = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSettingsOpen(true);
    window.setTimeout(() => {
      document.getElementById("account-settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleSaveProfile = async () => {
    const nextName = form.name.trim();
    const nextPhone = form.phone.trim();

    if (!nextName) {
      toast.error(language === "en" ? "Please enter your full name" : "Vui lòng nhập họ tên");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await authService.updateProfile({
        name: nextName,
        phone: nextPhone,
      });
      updateProfile({
        name: updated.name || updated.fullName || nextName,
        phone: updated.phone || nextPhone || null,
        avatar: updated.avatar || user.avatar,
        authProvider: updated.authProvider || user.authProvider,
        hasPassword: typeof updated.hasPassword === "boolean" ? updated.hasPassword : user.hasPassword,
      });
      toast.success(t("settings.savedProfile"));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || (language === "en" ? "Could not update profile" : "Không thể cập nhật hồ sơ"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();

    if (user.hasPassword && !passwordForm.oldPassword) {
      toast.error(language === "en" ? "Please enter your current password" : "Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(language === "en" ? "Password must be at least 6 characters" : "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(language === "en" ? "Password confirmation does not match" : "Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setChangingPassword(true);
      if (user.hasPassword) {
        await authService.changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        });
      } else {
        await authService.setPassword({
          password: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        });
      }

      updateProfile({ hasPassword: true });
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success(t("settings.savedPassword"));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || (language === "en" ? "Could not update password" : "Không thể cập nhật mật khẩu"));
    } finally {
      setChangingPassword(false);
    }
  };

  const renderPasswordField = (
    key: "oldPassword" | "newPassword" | "confirmPassword",
    label: string,
    placeholder: string,
  ) => {
    const isVisible = showPasswordFields[key];

    return (
      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <KeyRound className="h-4 w-4 text-gold" />
          {label}
        </span>
        <div className="relative">
          <input
            type={isVisible ? "text" : "password"}
            value={passwordForm[key]}
            disabled={changingPassword}
            onChange={(event) => setPasswordForm((prev) => ({ ...prev, [key]: event.target.value }))}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:bg-muted/40"
          />
          <button
            type="button"
            onClick={() => setShowPasswordFields((prev) => ({ ...prev, [key]: !prev[key] }))}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-gold"
            aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>
    );
  };

  const renderSettingsContent = () => {
    if (activeTab === "profile") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-gold" />
              Họ tên
            </span>
            <input
              value={form.name}
              disabled={savingProfile}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4 text-gold" />
              Số điện thoại
            </span>
            <input
              value={form.phone}
              disabled={savingProfile}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Nhập số điện thoại"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-gold" />
              Email đăng nhập
            </span>
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary shadow-luxury transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu thông tin
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "password") {
      return (
        <form onSubmit={handleChangePassword} className="space-y-4">
          {user.hasPassword && renderPasswordField("oldPassword", "Mật khẩu hiện tại", "Nhập mật khẩu hiện tại")}
          <div className="grid gap-4 md:grid-cols-2">
            {renderPasswordField("newPassword", "Mật khẩu mới", "Ít nhất 6 ký tự")}
            {renderPasswordField("confirmPassword", "Nhập lại mật khẩu", "Nhập lại mật khẩu mới")}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {user.hasPassword ? "Đổi mật khẩu" : "Thiết lập mật khẩu"}
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <PreferenceToggle
          checked={preferences.emailUpdates}
          icon={Mail}
          label="Nhận email ưu đãi"
          description="Gửi ưu đãi, mã giảm giá và gợi ý điểm đến phù hợp."
          onChange={(checked) => setPreferences((prev: any) => ({ ...prev, emailUpdates: checked }))}
        />
        <PreferenceToggle
          checked={preferences.bookingReminders}
          icon={Bell}
          label="Nhắc lịch booking"
          description="Nhận nhắc trước ngày nhận phòng và khi đơn thay đổi trạng thái."
          onChange={(checked) => setPreferences((prev: any) => ({ ...prev, bookingReminders: checked }))}
        />
        <PreferenceToggle
          checked={preferences.compactBookings}
          icon={ClipboardList}
          label="Danh sách booking gọn"
          description="Hiển thị ít đơn hơn trên trang cá nhân để dễ quét nhanh."
          onChange={(checked) => setPreferences((prev: any) => ({ ...prev, compactBookings: checked }))}
        />

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Languages className="h-4 w-4 text-gold" />
            Ngôn ngữ và tiền tệ
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={preferences.language}
              onChange={(event) => setPreferences((prev: any) => ({ ...prev, language: event.target.value }))}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
            <select
              value={preferences.currency}
              onChange={(event) => setPreferences((prev: any) => ({ ...prev, currency: event.target.value }))}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tùy chỉnh này được lưu trên thiết bị hiện tại để cá nhân hóa giao diện profile.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-10 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">{t("profile.personalAccount")}</p>
                <h1 className="mt-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
                  {t("profile.title")}
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {t("profile.subtitle")}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/hotels"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary shadow-luxury transition hover:opacity-95"
                >
                  <CalendarCheck className="h-4 w-4" />
                  {t("profile.newBooking")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <ScrollReveal direction="left">
              <aside className="space-y-6">
                <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-gold text-4xl font-black text-primary shadow-luxury">
                        {avatarInitial}
                      </div>
                      <span className="absolute -right-1 bottom-2 rounded-full border-4 border-card bg-emerald-500 p-1.5" />
                    </div>

                    <h2 className="mt-4 font-heading text-2xl font-bold">{user.name}</h2>
                    <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="break-all">{user.email}</span>
                    </p>
                    {user.phone && (
                      <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </p>
                    )}

                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">
                      <Sparkles className="h-4 w-4" />
                      {stats.memberTier}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-gold" />
                        {t("settings.loginBy")}
                      </span>
                      <span className="font-semibold">{providerLabel}</span>
                    </div>
                    <Link
                      to="/settings?tab=password"
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition hover:border-gold hover:bg-gold/5"
                    >
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <KeyRound className="h-4 w-4 text-gold" />
                        {t("settings.password")}
                      </span>
                      <span className={user.hasPassword ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
                        {passwordLabel}
                      </span>
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition hover:border-gold hover:bg-gold/5"
                    >
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Heart className="h-4 w-4 text-gold" />
                        {t("menu.favorites")}
                      </span>
                      <span className="font-semibold text-red-500">{favoriteIds.length}</span>
                    </Link>
                    <Link
                      to="/settings?tab=preferences"
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition hover:border-gold hover:bg-gold/5"
                    >
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <SlidersHorizontal className="h-4 w-4 text-gold" />
                        {t("settings.preferences")}
                      </span>
                      <span className="font-semibold">{currency}</span>
                    </Link>
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-heading text-xl font-bold">{t("profile.memberOverview")}</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("profile.spent")}</span>
                        <span className="font-semibold text-gold">{formatCurrency(stats.totalSpent)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-gold"
                          style={{ width: `${Math.min(100, (stats.totalSpent / 50000000) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t("profile.memberHint")}
                    </p>
                  </div>
                </section>
              </aside>
            </ScrollReveal>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: t("profile.totalBookings"), value: stats.total, icon: ClipboardList },
                  { label: t("profile.activeOrders"), value: stats.active, icon: CalendarCheck },
                  { label: t("profile.paidOrders"), value: stats.paid, icon: CreditCard },
                  { label: t("profile.upcoming"), value: stats.upcoming, icon: BadgeCheck },
                  { label: profileCopy.pendingReviews, value: stats.pendingReviews, icon: MessageSquareHeart },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="mt-2 text-2xl font-bold">{bookingsLoading ? "--" : item.value}</p>
                        </div>
                        <div className="rounded-lg bg-gold/10 p-3 text-gold">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!bookingsLoading && stats.pendingReviewBookings.length > 0 && (
                <ScrollReveal>
                  <section className="overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 via-card to-card p-6 shadow-luxury">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {profileCopy.pendingReviews}
                        </p>
                        <h2 className="mt-3 font-heading text-2xl font-bold">{profileCopy.reviewPromptTitle}</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{profileCopy.reviewPromptDesc}</p>
                      </div>
                      <Link
                        to="/my-bookings?filter=need_review"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        <MessageSquareHeart className="h-4 w-4" />
                        {profileCopy.pendingReviews}: {stats.pendingReviews}
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {stats.pendingReviewBookings.slice(0, 3).map((booking: any) => (
                        <Link
                          key={booking.id}
                          to={`/my-bookings/${booking.id}#review`}
                          className="rounded-xl border border-border bg-background/80 p-4 transition hover:border-gold hover:bg-background"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
                            {booking.bookingCode || booking.id}
                          </p>
                          <h3 className="mt-2 line-clamp-1 font-heading text-lg font-bold">{getHotelName(booking, language)}</h3>
                          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{getRoomName(booking, language)}</p>
                          <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gold">
                            <Star className="h-4 w-4 fill-current" />
                            {profileCopy.writeReview}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>
              )}

              {settingsOpen && (
                <ScrollReveal>
                  <section id="account-settings" className="rounded-xl border border-border bg-card p-6 shadow-luxury">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="font-heading text-2xl font-bold">Cài đặt tài khoản</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Quản lý thông tin cá nhân, mật khẩu và các tùy chỉnh hiển thị của profile.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(false)}
                        className="self-start rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Đóng cài đặt"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-1.5">
                      {[
                        { id: "profile" as const, label: "Thông tin", icon: User },
                        { id: "password" as const, label: "Mật khẩu", icon: KeyRound },
                        { id: "preferences" as const, label: "Tùy chỉnh", icon: SlidersHorizontal },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                              active ? "bg-card text-gold shadow-sm" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6">{renderSettingsContent()}</div>
                  </section>
                </ScrollReveal>
              )}

              <ScrollReveal direction="right">
                <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">{t("profile.bookingDetails")}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("profile.bookingDetailsDesc")}
                      </p>
                    </div>
                    <Link
                      to="/my-bookings"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:border-gold hover:text-gold"
                    >
                      {t("profile.viewAll")}
                    </Link>
                  </div>

                  <div className="mt-6">
                    {bookingsLoading ? (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-gold" />
                        {t("profile.loadingBookings")}
                      </div>
                    ) : bookingPreview.length > 0 ? (
                      <div className="space-y-4">
                        {bookingPreview.map((booking) => {
                          const status = {
                            ...getBadge(statusCopy, booking.status),
                            label: t(`booking.status.${String(booking.status || "pending").toLowerCase()}`),
                          };
                          const payment = {
                            ...getBadge(paymentCopy, booking.paymentStatus),
                            label: t(`booking.payment.${String(booking.paymentStatus || "pending").toLowerCase()}`),
                          };
                          const total = Number(booking.total || booking.payment?.amount || 0);
                          const localReview = getLocalBookingReview(booking.id);
                          const canReview = canReviewBooking(booking);

                          return (
                            <article
                              key={booking.id}
                              className="rounded-xl border border-border bg-background p-4 transition hover:border-gold/50 hover:shadow-md"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                                      {booking.bookingCode || booking.id}
                                    </span>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                                      {status.label}
                                    </span>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${payment.className}`}>
                                      {payment.label}
                                    </span>
                                    {localReview ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {profileCopy.reviewed}
                                      </span>
                                    ) : canReview ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                                        <Star className="h-3.5 w-3.5 fill-current" />
                                        {profileCopy.reviewPending}
                                      </span>
                                    ) : null}
                                  </div>
                                  <h3 className="mt-3 font-heading text-xl font-bold">{getHotelName(booking, language)}</h3>
                                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                    <BedDouble className="h-4 w-4 text-gold" />
                                    {getRoomName(booking, language)}
                                  </p>
                                </div>

                                <div className="text-left lg:text-right">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("booking.total")}</p>
                                  <p className="mt-1 text-xl font-bold text-gold">{formatCurrency(total)}</p>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
                                <InfoPill icon={CalendarDays} label={t("booking.checkIn")} value={formatDate(booking.checkIn, language)} />
                                <InfoPill icon={CalendarDays} label={t("booking.checkOut")} value={formatDate(booking.checkOut, language)} />
                                <InfoPill icon={Receipt} label={t("booking.nights")} value={`${booking.nights || 0} ${t("hotelCard.perNight").replace("/", "").trim()}`} />
                                <InfoPill icon={Wallet} label={t("booking.guestRoom")} value={`${interpolate(t("hotels.guestCount"), { count: booking.guests || 0 })} - ${interpolate(t("hotels.roomCount"), { count: booking.roomsCount || 0 })}`} />
                              </div>

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-muted-foreground">
                                  {t("booking.booker")}: <span className="font-semibold text-foreground">{booking.guestName || user.name}</span>
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  {localReview ? (
                                    <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                                      <CheckCircle2 className="h-4 w-4" />
                                      {profileCopy.reviewed}
                                    </span>
                                  ) : canReview && (
                                    <Link
                                      to={`/my-bookings/${booking.id}#review`}
                                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold hover:text-primary"
                                    >
                                      <Star className="h-4 w-4 fill-current" />
                                      {profileCopy.writeReview}
                                    </Link>
                                  )}
                                  <Link
                                    to={`/my-bookings/${booking.id}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                                  >
                                    {t("booking.viewDetail")}
                                  </Link>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                        <ClipboardList className="mx-auto h-10 w-10 text-gold" />
                        <h3 className="mt-3 font-heading text-xl font-bold">{t("profile.noBookings")}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t("profile.noBookingsHint")}
                        </p>
                        <Link
                          to="/hotels"
                          className="mt-5 inline-flex items-center justify-center rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary"
                        >
                          {t("profile.findHotel")}
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const InfoPill = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-muted/20 p-3">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-gold" />
      {label}
    </div>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
);

const PreferenceToggle = ({
  checked,
  icon: Icon,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  icon: any;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4 text-left transition hover:border-gold/60"
  >
    <span className="flex gap-3">
      <span className="rounded-lg bg-gold/10 p-2 text-gold">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
      </span>
    </span>
    <span className={`mt-1 flex h-6 w-11 items-center rounded-full p-1 transition ${checked ? "bg-gold" : "bg-muted-foreground/30"}`}>
      <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </span>
  </button>
);

export default ProfilePage;
