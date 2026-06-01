import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale, type AppLanguage } from "@/contexts/LocaleContext";
import { apiFetch } from "@/services/apiClient";
import { getPublishedNewsArticles, localizeNewsArticles } from "@/services/newsStore";
import {
  AppNotification,
  getReadNotificationIds,
  NotificationKind,
  NotificationScope,
  setReadNotificationIds,
  sortNotifications,
} from "@/services/notificationService";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  scope: NotificationScope;
  pagePath: string;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

interface BackendNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAt: string;
  href?: string | null;
  statusLabel?: string | null;
  isRead: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

const buildNewsNotifications = (readIds: Set<string>, language: AppLanguage) => {
  const articles = localizeNewsArticles(getPublishedNewsArticles(), language);
  const isEnglish = language === "en";

  return articles.map(
    (article): AppNotification => ({
      id: `news:${article.id}`,
      kind: "news",
      title: `${isEnglish ? "New article" : "Bài viết mới"}: ${article.title}`,
      description: article.excerpt || (isEnglish ? "Luxury Stay has published a new article for you." : "Luxury Stay vừa đăng một bài viết mới dành cho bạn."),
      createdAt: article.date,
      href: `/news/${article.id}`,
      unread: !readIds.has(`news:${article.id}`),
      statusLabel: article.category,
      source: "local",
    }),
  );
};

const mapBackendNotifications = (items: BackendNotification[]): AppNotification[] =>
  items.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    description: item.message,
    createdAt: item.createdAt,
    href: item.href || "/notifications",
    unread: !item.isRead,
    statusLabel: item.statusLabel || undefined,
    source: "backend",
  }));

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, portal } = useAuth();
  const { language } = useLocale();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scope: NotificationScope = portal === "admin" ? "admin" : "user";
  const pagePath = scope === "admin" ? "/admin/notifications" : "/notifications";
  const scopeKey = useMemo(() => {
    if (!user) return "";
    return `${scope}:${user.id || user.email}`;
  }, [scope, user]);

  const refreshNotifications = useCallback(async () => {
    if (!user || !scopeKey) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const backendItems = (await apiFetch(
        scope === "admin" ? "/notifications/admin" : "/notifications/user",
      ).catch(() => [])) as BackendNotification[];

      const merged =
        scope === "user"
          ? [
              ...mapBackendNotifications(backendItems),
              ...buildNewsNotifications(getReadNotificationIds(scopeKey), language),
            ]
          : mapBackendNotifications(backendItems);

      setNotifications(sortNotifications(merged));
    } finally {
      setIsLoading(false);
    }
  }, [language, scope, scopeKey, user]);

  useEffect(() => {
    refreshNotifications();

    if (!user) return;

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "luxstay_news_articles" || event.key === "luxstay_notification_reads_v1") {
        refreshNotifications();
      }
    };

    const handleFocus = () => {
      refreshNotifications();
    };

    const interval = window.setInterval(refreshNotifications, 15000);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshNotifications, user]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      const target = notifications.find((item) => item.id === notificationId);
      if (!target) return;

      if (target.source === "backend") {
        setNotifications((prev) =>
          prev.map((item) => (item.id === notificationId ? { ...item, unread: false } : item)),
        );

        void apiFetch(`/notifications/${notificationId}/read`, {
          method: "PATCH",
        }).catch(() => {
          refreshNotifications();
        });
        return;
      }

      if (!scopeKey) return;
      const readIds = getReadNotificationIds(scopeKey);
      if (!readIds.has(notificationId)) {
        readIds.add(notificationId);
        setReadNotificationIds(scopeKey, Array.from(readIds));
      }

      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, unread: false } : item)),
      );
    },
    [notifications, refreshNotifications, scopeKey],
  );

  const markAllAsRead = useCallback(() => {
    if (scope === "user" && scopeKey) {
      const localIds = notifications
        .filter((item) => item.source === "local")
        .map((item) => item.id);
      setReadNotificationIds(scopeKey, localIds);
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));

    void apiFetch(scope === "admin" ? "/notifications/read-all/admin" : "/notifications/read-all/user", {
      method: "PATCH",
    }).catch(() => {
      refreshNotifications();
    });
  }, [notifications, refreshNotifications, scope, scopeKey]);

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        scope,
        pagePath,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
