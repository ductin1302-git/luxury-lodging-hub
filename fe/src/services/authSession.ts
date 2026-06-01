export type AuthPortal = "user" | "admin";

interface StoredAuthSession {
  token: string;
  user: any;
  updatedAt: number;
}

const USER_SESSION_KEY = "luxstay_user_session";
const ADMIN_SESSION_KEY = "luxstay_admin_session";
const ADMIN_LAST_ACTIVITY_KEY = "luxstay_admin_last_activity";
const AUTH_SESSION_EVENT = "luxstay-auth-session-change";

const SESSION_KEYS: Record<AuthPortal, string> = {
  user: USER_SESSION_KEY,
  admin: ADMIN_SESSION_KEY,
};

const canUseSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const emitSessionChange = (portal: AuthPortal) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_EVENT, {
      detail: { portal },
    }),
  );
};

const readSession = (portal: AuthPortal): StoredAuthSession | null => {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(SESSION_KEYS[portal]);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSession = (portal: AuthPortal, session: StoredAuthSession) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(SESSION_KEYS[portal], JSON.stringify(session));
  emitSessionChange(portal);
};

export const resolveAuthPortal = (pathname: string): AuthPortal =>
  pathname.startsWith("/admin") || pathname.startsWith("/LoginAdmin/admin")
    ? "admin"
    : "user";

export const getCurrentAuthPortal = (): AuthPortal =>
  resolveAuthPortal(typeof window !== "undefined" ? window.location.pathname : "/");

export const getPortalSession = (portal: AuthPortal) => readSession(portal);

export const getPortalAccessToken = (portal: AuthPortal) =>
  readSession(portal)?.token ?? null;

export const getPortalStoredUser = (portal: AuthPortal) =>
  readSession(portal)?.user ?? null;

export const setPortalSession = (
  portal: AuthPortal,
  token: string,
  user: any,
) => {
  writeSession(portal, {
    token,
    user,
    updatedAt: Date.now(),
  });
};

export const clearPortalSession = (portal: AuthPortal) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(SESSION_KEYS[portal]);
  emitSessionChange(portal);
};

export const clearAdminMirrorFromUserPortal = (adminUserId?: string) => {
  const userSession = readSession("user");
  if (!userSession?.user) return;

  const isAdminMirror =
    String(userSession.user.role || "").toLowerCase() === "admin" &&
    (!adminUserId || userSession.user.id === adminUserId);

  if (isAdminMirror) {
    clearPortalSession("user");
  }
};

export const mirrorAdminSessionToUserPortal = () => {
  const adminSession = readSession("admin");
  if (!adminSession) return false;

  writeSession("user", {
    ...adminSession,
    updatedAt: Date.now(),
  });
  return true;
};

export const touchAdminActivity = () => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
};

export const getAdminLastActivity = () => {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const clearAdminActivity = () => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
};

export const isInternalRole = (role?: string | null) =>
  ["admin", "staff"].includes(String(role || "").toLowerCase());

export const isCustomerFacingRole = (role?: string | null) =>
  !isInternalRole(role);

export const getAuthSessionEventName = () => AUTH_SESSION_EVENT;
