import { useMemo, useState } from "react";
import { CheckCheck, Filter } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
  formatNotificationTime,
  getNotificationEmptyState,
  getNotificationMeta,
  localizeNotificationStatus,
} from "@/services/notificationService";

const NotificationsPage = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const { language } = useLocale();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unread" | "news" | "contact_reply" | "user_booking" | "user_payment"
  >("all");

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter((item) => item.unread);
    return notifications.filter((item) => item.kind === activeFilter);
  }, [activeFilter, notifications]);

  const emptyState = getNotificationEmptyState("user", language);
  const copy =
    language === "en"
      ? {
          eyebrow: "Notification Center",
          title: "Your notifications",
          desc: "Track new articles, booking updates, payment changes and support replies tailored for you.",
          markAll: "Mark all as read",
          unread: "Unread items",
          booking: "Booking updates",
          bookingFilter: "Đặt phòng",
          payment: "Payment updates",
          paymentFilter: "Payment",
          support: "Support replies",
          supportFilter: "Support",
          filter: "Filter notifications:",
          all: "All",
          unreadFilter: "Unread",
          news: "News",
          loading: "Loading notifications...",
          emptyTitle: "No notifications yet",
          emptyDesc: "Important booking, payment and support updates will appear here.",
        }
      : {
          eyebrow: "Trung tâm thông báo",
          title: "Thông báo của bạn",
          desc: "Theo dõi tin tức mới, cập nhật booking, thay đổi thanh toán và các phản hồi hỗ trợ dành riêng cho bạn.",
          markAll: "Đánh dấu đã đọc tất cả",
          unread: "Mục chưa đọc",
          booking: "Cập nhật booking",
          bookingFilter: "Booking",
          payment: "Cập nhật thanh toán",
          paymentFilter: "Thanh toán",
          support: "Phản hồi hỗ trợ",
          supportFilter: "Hỗ trợ",
          filter: "Lọc thông báo:",
          all: "Tất cả",
          unreadFilter: "Chưa đọc",
          news: "Tin tức",
          loading: "Đang tải thông báo...",
          emptyTitle: emptyState.title,
          emptyDesc: emptyState.description,
        };

  return (
    <div className="min-h-screen bg-[#f5f1ea]">
      <Header />

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{copy.eyebrow}</p>
            <h1 className="mt-2 font-heading text-4xl font-bold text-slate-900">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              {copy.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4 text-gold" /> {copy.markAll}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-3xl font-black text-slate-900">{unreadCount}</p>
            <p className="mt-1 text-sm text-slate-500">{copy.unread}</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-3xl font-black text-slate-900">
              {notifications.filter((item) => item.kind === "user_booking").length}
            </p>
            <p className="mt-1 text-sm text-slate-500">{copy.booking}</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-3xl font-black text-slate-900">
              {notifications.filter((item) => item.kind === "user_payment").length}
            </p>
            <p className="mt-1 text-sm text-slate-500">{copy.payment}</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-3xl font-black text-slate-900">
              {notifications.filter((item) => item.kind === "contact_reply").length}
            </p>
            <p className="mt-1 text-sm text-slate-500">{copy.support}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Filter className="h-4 w-4" /> {copy.filter}
          </div>
          {[
            { label: copy.all, value: "all" },
            { label: copy.unreadFilter, value: "unread" },
            { label: copy.news, value: "news" },
            { label: copy.bookingFilter, value: "user_booking" },
            { label: copy.paymentFilter, value: "user_payment" },
            { label: copy.supportFilter, value: "contact_reply" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveFilter(item.value as typeof activeFilter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeFilter === item.value
                  ? "bg-gold text-primary"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">{copy.loading}</div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => {
                const meta = getNotificationMeta(notification.kind, language);
                const Icon = meta.icon;

                return (
                  <Link
                    key={notification.id}
                    to={notification.href}
                    onClick={() => markAsRead(notification.id)}
                    className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-slate-50 md:flex-row md:items-start"
                  >
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${meta.accentClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">{notification.title}</h2>
                            {notification.unread && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{notification.description}</p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium text-slate-400">
                            {formatNotificationTime(notification.createdAt, language)}
                          </p>
                          {notification.statusLabel && (
                            <p className="mt-2 text-xs font-semibold text-gold-dark">
                              {localizeNotificationStatus(notification.statusLabel, language)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-semibold text-slate-900">{copy.emptyTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{copy.emptyDesc}</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
