import { useMemo, useState } from "react";
import { Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useLocale } from "@/contexts/LocaleContext";
import {
  AppNotification,
  formatNotificationTime,
  getNotificationMeta,
  localizeNotificationStatus,
} from "@/services/notificationService";

interface NotificationBellProps {
  items: AppNotification[];
  unreadCount: number;
  isLoading?: boolean;
  viewAllPath: string;
  onOpenNotification: (notificationId: string) => void;
  theme?: "light" | "dark";
}

const NotificationBell = ({
  items,
  unreadCount,
  isLoading = false,
  viewAllPath,
  onOpenNotification,
  theme = "light",
}: NotificationBellProps) => {
  const { language } = useLocale();
  const [open, setOpen] = useState(false);

  const previewItems = useMemo(() => items.slice(0, 5), [items]);
  const isDark = theme === "dark";
  const copy =
    language === "en"
      ? {
          title: "Notifications",
          unread: `${unreadCount} unread item${unreadCount === 1 ? "" : "s"}`,
          allRead: "You are all caught up",
          viewAll: "View all",
          loading: "Loading notifications...",
          empty: "No new notifications yet.",
        }
      : {
          title: "Thông báo",
          unread: `${unreadCount} mục chưa đọc`,
          allRead: "Bạn đã xem hết thông báo mới",
          viewAll: "Xem tất cả",
          loading: "Đang tải thông báo...",
          empty: "Chưa có thông báo mới.",
        };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
          isDark
            ? "border-white/12 bg-white/8 text-white hover:bg-white/12"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-primary">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 top-full z-20 mt-3 w-[360px] overflow-hidden rounded-[1.5rem] border shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8),0_0_1px_rgba(255,255,255,0.1)] ${
              isDark
                ? "border-white/10 bg-[#0c1a2e] text-white"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className={`flex items-center justify-between px-5 py-4 ${isDark ? "border-b border-white/8" : "border-b border-slate-100"}`}>
              <div>
                <p className="text-sm font-semibold">{copy.title}</p>
                <p className={`text-xs ${isDark ? "text-white/55" : "text-slate-500"}`}>
                  {unreadCount > 0 ? copy.unread : copy.allRead}
                </p>
              </div>
              <Link
                to={viewAllPath}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gold"
              >
                {copy.viewAll} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="max-h-[420px] overflow-auto px-3 py-3">
              {isLoading ? (
                <div className="px-3 py-10 text-center text-sm text-slate-400">{copy.loading}</div>
              ) : previewItems.length > 0 ? (
                <div className="space-y-2">
                  {previewItems.map((item) => {
                    const meta = getNotificationMeta(item.kind, language);
                    const Icon = meta.icon;

                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => {
                          onOpenNotification(item.id);
                          setOpen(false);
                        }}
                        className={`block rounded-2xl px-3 py-3 transition-colors ${
                          isDark ? "hover:bg-white/6" : "hover:bg-slate-50"
                        } ${item.unread ? (isDark ? "bg-white/[0.04]" : "bg-slate-50/80") : ""}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${meta.accentClass}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className={`line-clamp-2 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                                {item.title}
                              </p>
                              {item.unread && (
                                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gold" />
                              )}
                            </div>
                            <p className={`mt-1 line-clamp-2 text-xs leading-5 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                              {item.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <span className={`text-[11px] font-medium ${isDark ? "text-white/45" : "text-slate-400"}`}>
                                {formatNotificationTime(item.createdAt, language)}
                              </span>
                              {item.statusLabel && (
                                <span className={`text-[11px] font-semibold ${isDark ? "text-gold-light" : "text-gold-dark"}`}>
                                  {localizeNotificationStatus(item.statusLabel, language)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-10 text-center text-sm text-slate-400">{copy.empty}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
