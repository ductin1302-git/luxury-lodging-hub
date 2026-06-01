import {
  BellDot,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  LucideIcon,
  MessageSquareMore,
  Newspaper,
} from "lucide-react";

export type NotificationScope = "admin" | "user";
type NotificationLanguage = "vi" | "en";
export type NotificationKind =
  | "news"
  | "contact_reply"
  | "user_booking"
  | "user_payment"
  | "admin_contact"
  | "admin_booking"
  | "admin_payment";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  createdAt: string;
  href: string;
  unread: boolean;
  statusLabel?: string;
  source?: "backend" | "local";
}

export const NOTIFICATION_READS_KEY = "luxstay_notification_reads_v1";

export const getNotificationMeta = (
  kind: NotificationKind,
  language: NotificationLanguage = "vi",
): { icon: LucideIcon; label: string; accentClass: string } => {
  const en = language === "en";

  switch (kind) {
    case "contact_reply":
      return {
        icon: MessageSquareMore,
        label: en ? "Support reply" : "Phản hồi hỗ trợ",
        accentClass: "text-emerald-600 bg-emerald-50",
      };
    case "user_booking":
      return {
        icon: CalendarDays,
        label: en ? "Booking update" : "Cập nhật booking",
        accentClass: "text-amber-700 bg-amber-50",
      };
    case "user_payment":
      return {
        icon: CreditCard,
        label: en ? "Payment update" : "Cập nhật thanh toán",
        accentClass: "text-sky-700 bg-sky-50",
      };
    case "admin_contact":
      return {
        icon: MessageSquareMore,
        label: en ? "Guest contact" : "Liên hệ khách hàng",
        accentClass: "text-blue-600 bg-blue-50",
      };
    case "admin_booking":
      return {
        icon: CalendarDays,
        label: en ? "Booking order" : "Đơn đặt phòng",
        accentClass: "text-amber-700 bg-amber-50",
      };
    case "admin_payment":
      return {
        icon: CircleDollarSign,
        label: en ? "Payment update" : "Cập nhật thanh toán",
        accentClass: "text-fuchsia-700 bg-fuchsia-50",
      };
    case "news":
    default:
      return {
        icon: Newspaper,
        label: en ? "Latest news" : "Tin tức mới",
        accentClass: "text-violet-600 bg-violet-50",
      };
  }
};

export const getNotificationEmptyState = (scope: NotificationScope, language: NotificationLanguage = "vi") => {
  const en = language === "en";

  if (scope === "admin") {
    return {
      title: en ? "No admin notifications yet" : "Chưa có thông báo quản trị",
      description: en
        ? "New contacts, booking updates and payment changes will appear here."
        : "Liên hệ mới, cập nhật booking và thay đổi thanh toán sẽ xuất hiện tại đây.",
    };
  }

  return {
    title: en ? "No notifications yet" : "Chưa có thông báo mới",
    description: en
      ? "New articles, booking updates, payments and support replies will appear here."
      : "Tin tức mới, cập nhật booking, thanh toán và phản hồi hỗ trợ sẽ hiển thị tại đây.",
  };
};

export const getNotificationReadMap = () => {
  if (typeof window === "undefined") return {} as Record<string, string[]>;

  const raw = localStorage.getItem(NOTIFICATION_READS_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

export const saveNotificationReadMap = (map: Record<string, string[]>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_READS_KEY, JSON.stringify(map));
};

export const getReadNotificationIds = (scopeKey: string) => {
  const map = getNotificationReadMap();
  return new Set(map[scopeKey] || []);
};

export const setReadNotificationIds = (scopeKey: string, ids: string[]) => {
  const map = getNotificationReadMap();
  map[scopeKey] = ids;
  saveNotificationReadMap(map);
};

export const sortNotifications = (notifications: AppNotification[]) =>
  [...notifications].sort(
    (left, right) =>
      new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
  );

export const formatNotificationTime = (value: string, language: NotificationLanguage = "vi") => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const localizeNotificationStatus = (value: string | undefined, language: NotificationLanguage = "vi") => {
  if (!value || language !== "en") return value;

  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    "tin tức": "News",
    "du lịch": "Travel",
    "ưu đãi": "Deals",
    "đặt phòng": "Booking",
    "thanh toán": "Payment",
    "đã phản hồi": "Replied",
    "đã đọc": "Read",
    "mới": "New",
    "chờ xác nhận": "Pending",
    "đã xác nhận": "Confirmed",
    "đã thanh toán": "Paid",
    "chờ thanh toán": "Payment pending",
    "đã hủy": "Cancelled",
  };

  return map[normalized] || value;
};

export const formatNotificationPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const getNotificationPreviewIcon = () => BellDot;
