import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, CircleDollarSign, ClipboardList, Heart, Languages, LogOut, Menu, Settings, User, X, Sparkles, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { type AppCurrency, type AppLanguage, useLocale } from "@/contexts/LocaleContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { getAvatarInitial } from "@/utils/user";
import BrandLogo from "@/components/brand/BrandLogo";

const navItems = [
  { to: "/", label: "nav.home" },
  { to: "/hotels", label: "nav.hotels" },
  { to: "/promotions", label: "nav.promotions" },
  { to: "/about", label: "nav.about" },
  { to: "/news", label: "nav.news" },
  { to: "/contact", label: "nav.contact" },
];

const Header = () => {
  const { user, logout } = useAuth();
  const { currency, language, setCurrency, setLanguage, t } = useLocale();
  const { notifications, unreadCount, isLoading, markAsRead, pagePath } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const avatarInitial = getAvatarInitial(user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (userMenu && !target.closest("[data-user-menu]")) {
        setUserMenu(false);
      }
      if (langOpen && !target.closest("[data-lang-dropdown]")) {
        setLangOpen(false);
      }
      if (currOpen && !target.closest("[data-curr-dropdown]")) {
        setCurrOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenu, langOpen, currOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
    setLangOpen(false);
    setCurrOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    setMobileOpen(false);
    toast.success(t("menu.logoutSuccess"));
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const localeControls = (
    <div className="header-locale-pill flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 backdrop-blur-xl transition-all duration-500 hover:border-gold/30 hover:bg-white/[0.12] hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.25)] select-none">
      {/* Language Custom Selector */}
      <div className="relative flex items-center gap-1" data-lang-dropdown>
        <Languages className="h-3.5 w-3.5 text-gold" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLangOpen(!langOpen);
            setCurrOpen(false);
          }}
          className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-white/90 outline-none transition-colors hover:text-gold"
          type="button"
        >
          {language}
          <ChevronDown className={`h-3 w-3 text-white/40 transition-transform duration-300 ${langOpen ? "rotate-180 text-gold" : ""}`} />
        </button>
        
        {langOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-3.5 min-w-[100px] rounded-2xl border border-white/[0.08] bg-[#0c1a2e] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-scale-in">
            {[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setLanguage(opt.value as AppLanguage);
                  setLangOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold uppercase transition-all hover:bg-white/[0.06] hover:text-gold ${
                  language === opt.value ? "text-gold bg-white/[0.04]" : "text-white/70"
                }`}
                type="button"
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="h-3.5 w-px bg-white/20" />

      {/* Currency Custom Selector */}
      <div className="relative flex items-center gap-1" data-curr-dropdown>
        <CircleDollarSign className="h-3.5 w-3.5 text-gold" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrOpen(!currOpen);
            setLangOpen(false);
          }}
          className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-white/90 outline-none transition-colors hover:text-gold"
          type="button"
        >
          {currency}
          <ChevronDown className={`h-3 w-3 text-white/40 transition-transform duration-300 ${currOpen ? "rotate-180 text-gold" : ""}`} />
        </button>

        {currOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-3.5 min-w-[100px] rounded-2xl border border-white/[0.08] bg-[#0c1a2e] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-scale-in">
            {[
              { value: "VND", label: "VND" },
              { value: "USD", label: "USD" }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setCurrency(opt.value as AppCurrency);
                  setCurrOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold uppercase transition-all hover:bg-white/[0.06] hover:text-gold ${
                  currency === opt.value ? "text-gold bg-white/[0.04]" : "text-white/70"
                }`}
                type="button"
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? "header-scrolled border-b border-white/[0.06] bg-[#0a1628]/95 py-0 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            : "border-b border-white/[0.08] bg-gradient-to-r from-[#0c1929] via-[#122240] to-[#0c1929] py-1"
        }`}
      >
        {/* Decorative top gold line */}
        <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        
        {/* Subtle animated shimmer across header */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="header-shimmer absolute -left-full top-0 h-full w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        </div>

        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ===== LOGO ===== */}
          <Link to="/" className="group relative flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md transition-all duration-500 group-hover:border-gold/30 group-hover:shadow-[0_0_24px_-6px_rgba(212,175,55,0.35)]">
              <BrandLogo className="h-9 w-9 transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" />
              {/* Gold glow behind logo on hover */}
              <div className="absolute inset-0 rounded-xl bg-gold/0 transition-all duration-500 group-hover:bg-gold/[0.08]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-white transition-colors duration-300 md:text-xl">
                Luxury Stay{" "}
                <span className="text-gradient-gold">Hotel</span>
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.25em] text-white/40 transition-colors duration-300 group-hover:text-gold/60 lg:block">
                Premium Experience
              </span>
            </div>
          </Link>

          {/* ===== NAVIGATION ===== */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-link group relative px-4 py-2.5 text-[13.5px] font-semibold tracking-wide transition-[transform,color,filter] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center inline-flex items-center justify-center ${
                    active
                      ? "text-gold scale-[1.16] filter drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)]"
                      : "text-white/80 hover:text-white hover:scale-[1.08]"
                  }`}
                >
                  {t(item.label)}
                  {/* Active / Hover underline with glow */}
                  <span
                    className={`absolute bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      active
                        ? "w-7 bg-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                        : "w-0 bg-gold/80 group-hover:w-5 group-hover:shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                    }`}
                  />
                  {/* Hover background glow */}
                  <span className="absolute inset-0 rounded-lg bg-white/0 transition-all duration-300 group-hover:bg-white/[0.04]" />
                </Link>
              );
            })}
          </nav>

          {/* ===== RIGHT CONTROLS ===== */}
          <div className="hidden items-center gap-2.5 lg:flex">
            {localeControls}

            {user ? (
              <>
                <NotificationBell
                  items={notifications}
                  unreadCount={unreadCount}
                  isLoading={isLoading}
                  viewAllPath={pagePath}
                  onOpenNotification={markAsRead}
                  theme="dark"
                />

                <div className="relative" data-user-menu>
                  <button
                    onClick={() => setUserMenu((prev) => !prev)}
                    className="group flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] px-2 py-1.5 backdrop-blur-xl transition-all duration-500 hover:border-gold/25 hover:bg-white/[0.1] hover:shadow-[0_0_25px_-8px_rgba(212,175,55,0.3)]"
                  >
                    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gold to-gold-dark text-xs font-bold text-navy-dark ring-2 ring-gold/20 transition-all duration-300 group-hover:ring-gold/40 group-hover:shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                      {avatarInitial}
                      {/* Animated ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-transparent bg-clip-border transition-all duration-500 group-hover:border-white/20" />
                    </div>
                    <span className="max-w-[140px] truncate pr-1 text-[13px] font-semibold text-white/90 transition-colors duration-300 group-hover:text-white">{user.name}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-white/50 transition-all duration-300 ${userMenu ? "rotate-180 text-gold" : "group-hover:text-white/70"}`} />
                  </button>

                  {/* User dropdown menu */}
                  {userMenu && (
                    <>
                      {/* Invisible backdrop for click outside */}
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                      <div
                        className="absolute right-0 top-full z-50 mt-3 min-w-[260px] origin-top-right animate-scale-in rounded-2xl border border-white/10 bg-[#0c1a2e] p-2 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]"
                        style={{ animationDuration: "0.25s" }}
                      >
                        {/* User info header */}
                        <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-navy-dark">
                            {avatarInitial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                            <p className="text-[11px] text-white/40">{language.toUpperCase()} • {currency}</p>
                          </div>
                        </div>

                        {[
                          { to: "/notifications", icon: Bell, label: t("menu.notifications"), badge: unreadCount },
                          { to: "/profile", icon: User, label: t("menu.profile") },
                          { to: "/favorites", icon: Heart, label: t("menu.favorites") },
                          { to: "/my-bookings", icon: ClipboardList, label: t("menu.bookings") },
                          { to: "/settings", icon: Settings, label: t("menu.settings") },
                        ].map((item, i) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setUserMenu(false)}
                            className="group/item flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/75 transition-all duration-300 hover:bg-white/[0.06] hover:text-white"
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <item.icon className="h-4 w-4 text-white/40 transition-colors duration-300 group-hover/item:text-gold" />
                            {item.label}
                            {item.badge ? (
                              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold/20 px-1.5 text-[10px] font-bold text-gold">
                                {item.badge}
                              </span>
                            ) : null}
                          </Link>
                        ))}

                        {user.role === "admin" && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserMenu(false)}
                            className="group/item mt-1 flex items-center gap-2.5 border-t border-white/[0.06] px-3 py-2.5 pt-3 text-[13px] font-semibold text-gold transition-all duration-300 hover:bg-gold/[0.06] hover:text-gold-light"
                          >
                            <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover/item:rotate-12" />
                            {t("menu.admin")}
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="group/item mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-white/[0.06] px-3 py-2.5 pt-3 text-left text-[13px] font-medium text-red-400/80 transition-all duration-300 hover:bg-red-500/[0.08] hover:text-red-300"
                        >
                          <LogOut className="h-4 w-4 transition-transform duration-300 group-hover/item:-translate-x-0.5" />
                          {t("menu.logout")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth"
                  className="group relative text-[13px] font-semibold text-white/85 transition-all duration-300 hover:text-white"
                >
                  {t("auth.login")}
                  <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-white/50 transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gold-dark via-gold to-gold-light px-5 py-2.5 text-[13px] font-bold text-navy-dark shadow-[0_4px_20px_-4px_rgba(212,175,55,0.4)] transition-all duration-500 hover:shadow-[0_8px_30px_-4px_rgba(212,175,55,0.55)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="relative z-10">{t("auth.register")}</span>
                  {/* Shimmer sweep on hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              </div>
            )}
          </div>

          {/* ===== MOBILE TOGGLE ===== */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white backdrop-blur-md transition-all duration-300 hover:border-gold/20 hover:bg-white/[0.1] lg:hidden"
            aria-label="Toggle menu"
          >
            <div className="relative h-5 w-5">
              <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${mobileOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
              <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${mobileOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
            </div>
          </button>
        </div>
      </header>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            style={{ animationDuration: "0.3s" }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Menu panel - slides from right */}
          <div
            className="absolute right-0 top-0 h-full w-[85%] max-w-[380px] border-l border-white/[0.06] bg-[#0a1628]/98 shadow-[-20px_0_60px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-slide-in"
            style={{ animationDuration: "0.4s", animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                <BrandLogo className="h-8 w-8" />
                <span className="font-heading text-lg font-bold text-white">
                  Luxury Stay <span className="text-gradient-gold">Hotel</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-[calc(100%-76px)] flex-col overflow-y-auto">
              {/* Locale controls */}
              <div className="border-b border-white/[0.06] px-5 py-4">
                {localeControls}
              </div>

              {/* Navigation links */}
              <nav className="flex-1 px-3 py-3">
                {navItems.map((item, i) => {
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-left ${
                        active
                          ? "bg-gold/[0.08] text-[14.5px] font-bold text-gold scale-[1.06] shadow-[inset_0_1px_1px_rgba(212,175,55,0.1)]"
                          : "text-[14.5px] font-semibold text-white/75 hover:bg-white/[0.04] hover:text-white"
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                      )}
                      {t(item.label)}
                    </Link>
                  );
                })}
              </nav>

              {/* User section */}
              <div className="border-t border-white/[0.06] px-3 py-3">
                {user ? (
                  <>
                    {/* User info */}
                    <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-navy-dark">
                        {avatarInitial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{user.name}</p>
                        <p className="text-[11px] text-white/40">{user.email || ""}</p>
                      </div>
                    </div>

                    {[
                      { to: "/notifications", icon: Bell, label: t("menu.notifications") },
                      { to: "/profile", icon: User, label: t("menu.profile") },
                      { to: "/favorites", icon: Heart, label: t("menu.favorites") },
                      { to: "/my-bookings", icon: ClipboardList, label: t("menu.bookings") },
                      { to: "/settings", icon: Settings, label: t("menu.settings") },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white/70 transition-all duration-300 hover:bg-white/[0.04] hover:text-white"
                      >
                        <item.icon className="h-4 w-4 text-white/40" />
                        {item.label}
                      </Link>
                    ))}

                    {user.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="mt-1 flex items-center gap-3 rounded-xl border-t border-white/[0.06] px-4 py-3 pt-4 text-[14px] font-semibold text-gold transition-colors hover:bg-gold/[0.06]"
                      >
                        <Sparkles className="h-4 w-4" /> {t("menu.admin")}
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-white/[0.06] px-4 py-3 pt-4 text-left text-[14px] font-medium text-red-400/80 transition-colors hover:bg-red-500/[0.08] hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" /> {t("menu.logout")}
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 px-1">
                    <Link
                      to="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-center text-[14px] font-semibold text-white transition-all hover:bg-white/[0.08]"
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      to="/auth?mode=register"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl bg-gradient-to-r from-gold-dark via-gold to-gold-light px-4 py-3.5 text-center text-[14px] font-bold text-navy-dark shadow-[0_4px_20px_-4px_rgba(212,175,55,0.3)]"
                    >
                      {t("auth.register")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
