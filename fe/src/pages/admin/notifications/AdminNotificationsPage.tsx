import { useMemo, useState } from "react";
import { BellRing, CalendarDays, CheckCheck, CircleDollarSign, Filter, MessageSquareMore } from "lucide-react";
import { Link } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  formatNotificationTime,
  getNotificationEmptyState,
  getNotificationMeta,
} from "@/services/notificationService";

const AdminNotificationsPage = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unread" | "admin_contact" | "admin_booking" | "admin_payment"
  >("all");

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter((item) => item.unread);
    return notifications.filter((item) => item.kind === activeFilter);
  }, [activeFilter, notifications]);

  const emptyState = getNotificationEmptyState("admin");
  const contactCount = notifications.filter((item) => item.kind === "admin_contact").length;
  const bookingCount = notifications.filter((item) => item.kind === "admin_booking").length;
  const paymentCount = notifications.filter((item) => item.kind === "admin_payment").length;

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Notification Center</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Thông báo quản trị</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi liên hệ mới, đơn đặt phòng, hoàn tiền và các thay đổi thanh toán cần xử lý ngay.
          </p>
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-white/5"
        >
          <CheckCheck className="h-4 w-4 text-gold" /> Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{unreadCount}</p>
              <p className="text-xs text-slate-500">Mục chưa đọc</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MessageSquareMore className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{contactCount}</p>
              <p className="text-xs text-slate-500">Liên hệ gần đây</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{bookingCount}</p>
              <p className="text-xs text-slate-500">Booking mới</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-700">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{paymentCount}</p>
              <p className="text-xs text-slate-500">Cập nhật thanh toán</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Filter className="h-4 w-4" /> Lọc thông báo:
        </div>
        {[
          { label: "Tất cả", value: "all" },
          { label: "Chưa đọc", value: "unread" },
          { label: "Liên hệ", value: "admin_contact" },
          { label: "Đặt phòng", value: "admin_booking" },
          { label: "Thanh toán", value: "admin_payment" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setActiveFilter(item.value as typeof activeFilter)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeFilter === item.value
                ? "bg-gold text-primary"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-white/80 dark:hover:bg-white/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">Đang tải thông báo...</div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredNotifications.map((notification) => {
              const meta = getNotificationMeta(notification.kind);
              const Icon = meta.icon;

              return (
                <Link
                  key={notification.id}
                  to={notification.href}
                  onClick={() => markAsRead(notification.id)}
                  className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] md:flex-row md:items-start"
                >
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${meta.accentClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900 dark:text-white">{notification.title}</h2>
                          {notification.unread && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {notification.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-slate-400">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                        {notification.statusLabel && (
                          <p className="mt-2 text-xs font-semibold text-gold-dark dark:text-gold-light">
                            {notification.statusLabel}
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
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{emptyState.title}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyState.description}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationsPage;
