import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ClipboardList,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { type AppCurrency, type AppLanguage, useLocale } from "@/contexts/LocaleContext";
import { authService } from "@/services/authService";
import { getAvatarInitial } from "@/utils/user";

type SettingsTab = "profile" | "password" | "preferences";

const tabItems: Array<{ id: SettingsTab; labelKey: string; descKey: string; icon: any }> = [
  { id: "profile", labelKey: "settings.profile", descKey: "settings.profileDesc", icon: User },
  { id: "password", labelKey: "settings.password", descKey: "settings.passwordDesc", icon: KeyRound },
  { id: "preferences", labelKey: "settings.preferences", descKey: "settings.preferencesDesc", icon: SlidersHorizontal },
];

const AccountSettingsPage = () => {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const { currency, language, setCurrency, setLanguage, t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    requestedTab && tabItems.some((tab) => tab.id === requestedTab) ? requestedTab : "profile",
  );
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
    if (!saved) {
      return { emailUpdates: true, bookingReminders: true, compactBookings: false };
    }

    try {
      const parsed = JSON.parse(saved);
      return {
        emailUpdates: parsed.emailUpdates ?? true,
        bookingReminders: parsed.bookingReminders ?? true,
        compactBookings: parsed.compactBookings ?? false,
      };
    } catch {
      return { emailUpdates: true, bookingReminders: true, compactBookings: false };
    }
  });

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  useEffect(() => {
    if (!requestedTab || !tabItems.some((tab) => tab.id === requestedTab)) return;
    setActiveTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    let existing = {};
    try {
      existing = JSON.parse(localStorage.getItem("luxury_profile_preferences") || "{}");
    } catch {
      existing = {};
    }

    localStorage.setItem(
      "luxury_profile_preferences",
      JSON.stringify({ ...existing, ...preferences, language, currency }),
    );
  }, [currency, language, preferences]);

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

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
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
            aria-label={isVisible ? "Hide password" : "Show password"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>
    );
  };

  const renderContent = () => {
    if (activeTab === "profile") {
      return (
        <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
          <h2 className="font-heading text-2xl font-bold">{t("settings.profile")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.profileDesc")}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-gold" />
                {t("settings.name")}
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
                {t("settings.phone")}
              </span>
              <input
                value={form.phone}
                disabled={savingProfile}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder={t("settings.phone")}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-gold" />
                {t("settings.email")}
              </span>
              <input
                value={user.email}
                disabled
                className="w-full rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary shadow-luxury transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("settings.saveInfo")}
            </button>
          </div>
        </section>
      );
    }

    if (activeTab === "password") {
      return (
        <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
          <h2 className="font-heading text-2xl font-bold">{user.hasPassword ? t("settings.changePassword") : t("settings.setPassword")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.passwordDesc")}</p>

          <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
            {user.hasPassword && renderPasswordField("oldPassword", t("settings.currentPassword"), t("settings.currentPassword"))}
            <div className="grid gap-4 md:grid-cols-2">
              {renderPasswordField("newPassword", t("settings.newPassword"), t("settings.newPassword"))}
              {renderPasswordField("confirmPassword", t("settings.confirmPassword"), t("settings.confirmPassword"))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {user.hasPassword ? t("settings.changePassword") : t("settings.setPassword")}
              </button>
            </div>
          </form>
        </section>
      );
    }

    return (
      <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
        <h2 className="font-heading text-2xl font-bold">{t("settings.preferences")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.preferencesDesc")}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PreferenceToggle
            checked={preferences.emailUpdates}
            icon={Mail}
            label={t("settings.emailDeals")}
            description={t("settings.emailDealsDesc")}
            onChange={(checked) => setPreferences((prev: any) => ({ ...prev, emailUpdates: checked }))}
          />
          <PreferenceToggle
            checked={preferences.bookingReminders}
            icon={Bell}
            label={t("settings.bookingReminder")}
            description={t("settings.bookingReminderDesc")}
            onChange={(checked) => setPreferences((prev: any) => ({ ...prev, bookingReminders: checked }))}
          />
          <PreferenceToggle
            checked={preferences.compactBookings}
            icon={ClipboardList}
            label={t("settings.compactBookings")}
            description={t("settings.compactBookingsDesc")}
            onChange={(checked) => setPreferences((prev: any) => ({ ...prev, compactBookings: checked }))}
          />

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <Languages className="h-4 w-4 text-gold" />
              {t("settings.languageCurrency")}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as AppCurrency)}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("settings.displayOnly")}</p>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-10 md:py-12">
            <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-gold">
              <ChevronLeft className="h-4 w-4" />
              {t("settings.backProfile")}
            </Link>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">{t("settings.title")}</p>
                <h1 className="mt-3 font-heading text-3xl font-bold md:text-4xl">{t("settings.manageProfile")}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{t("settings.subtitle")}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto grid gap-6 px-4 py-10 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold text-2xl font-black text-primary">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-xl font-bold">{user.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-gold" />
                    {t("settings.loginBy")}
                  </span>
                  <span className="font-semibold">{providerLabel}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <KeyRound className="h-4 w-4 text-gold" />
                    {t("settings.password")}
                  </span>
                  <span className={user.hasPassword ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
                    {passwordLabel}
                  </span>
                </div>
              </div>
            </section>

            <nav className="rounded-xl border border-border bg-card p-2 shadow-sm">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    className={`flex w-full gap-3 rounded-lg p-4 text-left transition ${
                      active ? "bg-gold/10 text-gold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>
                      <span className="block font-semibold">{t(tab.labelKey)}</span>
                      <span className="mt-1 block text-xs leading-5 opacity-80">{t(tab.descKey)}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div>{renderContent()}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

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

export default AccountSettingsPage;
