import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { authService } from "@/services/authService";
import { ApiError } from "@/services/apiClient";
import {
  AuthPortal,
  clearAdminActivity,
  clearAdminMirrorFromUserPortal,
  clearPortalSession,
  getAdminLastActivity,
  getPortalAccessToken,
  getPortalStoredUser,
  mirrorAdminSessionToUserPortal,
  resolveAuthPortal,
  setPortalSession,
  touchAdminActivity,
} from "@/services/authSession";

const ADMIN_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: "customer" | "admin" | "staff";
  authProvider?: string;
  hasPassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  portal: AuthPortal;
  login: (email: string, password: string, portalOverride?: AuthPortal) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, portalOverride?: AuthPortal) => Promise<boolean>;
  requestPhoneOtp: (phone: string) => Promise<boolean>;
  verifyPhoneOtp: (phone: string, otp: string, portalOverride?: AuthPortal) => Promise<boolean>;
  requestEmailOtp: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean }>;
  completeRegister: (data: any, portalOverride?: AuthPortal) => Promise<boolean>;
  logout: (portalOverride?: AuthPortal) => void;
  updateProfile: (data: Partial<User>, portalOverride?: AuthPortal) => void;
  setTokenAndUser: (token: string, user: any, portalOverride?: AuthPortal) => void;
  setPassword: (password: string, confirmPassword: string, portalOverride?: AuthPortal) => Promise<boolean>;
  enterWebsiteAsAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const normalizeUser = (userData: any): User => ({
  id: userData?.id ?? "",
  name: userData?.name || userData?.fullName || "",
  email: userData?.email ?? "",
  phone: userData?.phone ?? null,
  avatar: userData?.avatar ?? null,
  role: String(userData?.role || "customer").toLowerCase() as "customer" | "admin" | "staff",
  authProvider: userData?.authProvider,
  hasPassword: Boolean(userData?.hasPassword),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const portal = useMemo(() => resolveAuthPortal(location.pathname), [location.pathname]);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const initialPortal = resolveAuthPortal(window.location.pathname);
      const cached = getPortalStoredUser(initialPortal);
      return cached ? normalizeUser(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem("hotel_token");
    localStorage.removeItem("hotel_user");
  }, []);

  const syncPortalState = useCallback(
    async (targetPortal: AuthPortal) => {
      const token = getPortalAccessToken(targetPortal);
      const cachedUser = getPortalStoredUser(targetPortal);

      if (!token) {
        if (targetPortal === portal) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      if (targetPortal === portal && cachedUser) {
        setUser(normalizeUser(cachedUser));
      }

      try {
        const userData = await authService.getMe();
        const normalized = normalizeUser(userData);
        setPortalSession(targetPortal, token, normalized);

        if (targetPortal === portal) {
          setUser(normalized);
        }
      } catch (error) {
        console.error("Auth initialization failed", error);

        const is401 = error instanceof ApiError && error.status === 401;
        if (is401) {
          clearPortalSession(targetPortal);
          if (targetPortal === "admin") {
            clearAdminActivity();
          }
        }

        if (targetPortal === portal) {
          if (!is401 && cachedUser) {
            setUser(normalizeUser(cachedUser));
          } else {
            setUser(null);
          }
        }
      } finally {
        if (targetPortal === portal) {
          setIsLoading(false);
        }
      }
    },
    [portal],
  );

  useEffect(() => {
    setIsLoading(true);
    syncPortalState(portal);
  }, [portal, syncPortalState]);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoading(true);
      syncPortalState(portal);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [portal, syncPortalState]);

  useEffect(() => {
    if (portal !== "admin" || !user || String(user.role).toLowerCase() !== "admin") {
      return;
    }

    const forceAdminLogout = () => {
      clearPortalSession("admin");
      clearAdminMirrorFromUserPortal(user.id);
      clearAdminActivity();
      setUser(null);
      window.location.replace("/LoginAdmin/admin?reason=timeout");
    };

    let timeoutId = 0;
    const scheduleLogout = (lastActivity: number) => {
      window.clearTimeout(timeoutId);

      const remaining = ADMIN_IDLE_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) {
        forceAdminLogout();
        return;
      }

      timeoutId = window.setTimeout(forceAdminLogout, remaining);
    };

    const existingLastActivity = getAdminLastActivity();
    if (existingLastActivity) {
      scheduleLogout(existingLastActivity);
    } else {
      touchAdminActivity();
      scheduleLogout(Date.now());
    }

    let lastRecorded = 0;
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecorded < 1000) return;
      lastRecorded = now;
      touchAdminActivity();
      scheduleLogout(now);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousedown",
      "mousemove",
      "scroll",
      "touchstart",
      "focus",
    ];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true }),
    );

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity),
      );
      window.clearTimeout(timeoutId);
    };
  }, [portal, user]);

  const setTokenAndUser = useCallback(
    (token: string, userData: any, portalOverride?: AuthPortal) => {
      const targetPortal = portalOverride || portal;
      const normalized = normalizeUser(userData);
      setPortalSession(targetPortal, token, normalized);

      if (targetPortal === "admin") {
        touchAdminActivity();
      }

      if (targetPortal === portal) {
        setUser(normalized);
      }
    },
    [portal],
  );

  const login = useCallback(
    async (email: string, password: string, portalOverride?: AuthPortal) => {
      const targetPortal = portalOverride || portal;

      try {
        setIsLoading(true);
        const data = await authService.login({ email, password });
        setTokenAndUser(data.accessToken, data.user, targetPortal);
        return true;
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error("Login failed", error);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [portal, setTokenAndUser],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      phone: string,
      portalOverride?: AuthPortal,
    ) => {
      const targetPortal = portalOverride || portal;

      try {
        setIsLoading(true);
        const data = await authService.register({ name, email, password, phone });
        setTokenAndUser(data.accessToken, data.user, targetPortal);
        return true;
      } catch (error) {
        console.error("Registration failed", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [portal, setTokenAndUser],
  );

  const requestPhoneOtp = useCallback(async (phone: string) => {
    try {
      await authService.requestOtp(phone);
      return true;
    } catch (error) {
      console.error("OTP request failed", error);
      return false;
    }
  }, []);

  const verifyPhoneOtp = useCallback(
    async (phone: string, otp: string, portalOverride?: AuthPortal) => {
      const targetPortal = portalOverride || portal;

      try {
        setIsLoading(true);
        const data = await authService.verifyOtp(phone, otp);
        setTokenAndUser(data.accessToken, data.user, targetPortal);
        return true;
      } catch (error) {
        console.error("OTP verification failed", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [portal, setTokenAndUser],
  );

  const requestEmailOtp = useCallback(async (email: string) => {
    try {
      const res = await authService.requestEmailOtp(email);
      return { success: true, message: res.message };
    } catch (error: any) {
      console.error("Email OTP request failed", error);
      return { success: false, message: error.message };
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, otp: string) => {
    try {
      await authService.verifyEmailOtp(email, otp);
      return { success: true };
    } catch (error: any) {
      console.error("Email OTP verification failed", error);
      return { success: false };
    }
  }, []);

  const completeRegister = useCallback(
    async (data: any, portalOverride?: AuthPortal) => {
      const targetPortal = portalOverride || portal;

      try {
        setIsLoading(true);
        const res = await authService.completeRegistration(data);
        setTokenAndUser(res.accessToken, res.user, targetPortal);
        return true;
      } catch (error) {
        console.error("Complete registration failed", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [portal, setTokenAndUser],
  );

  const setPassword = useCallback(
    async (password: string, confirmPassword: string, portalOverride?: AuthPortal) => {
      const targetPortal = portalOverride || portal;

      try {
        setIsLoading(true);
        const res = await authService.setPassword({ password, confirmPassword });
        setTokenAndUser(res.accessToken, res.user, targetPortal);
        return true;
      } catch (error) {
        console.error("Set password failed", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [portal, setTokenAndUser],
  );

  const logout = useCallback(
    (portalOverride?: AuthPortal) => {
      const targetPortal = portalOverride || portal;
      const targetUser = targetPortal === portal ? user : getPortalStoredUser(targetPortal);

      clearPortalSession(targetPortal);

      if (targetPortal === "admin") {
        clearAdminMirrorFromUserPortal(targetUser?.id);
        clearAdminActivity();
      }

      if (targetPortal === portal) {
        setUser(null);
      }
    },
    [portal, user],
  );

  const updateProfile = useCallback(
    (data: Partial<User>, portalOverride?: AuthPortal) => {
      const targetPortal = portalOverride || portal;
      const currentUser = targetPortal === portal ? user : getPortalStoredUser(targetPortal);
      const token = getPortalAccessToken(targetPortal);

      if (!currentUser || !token) return;

      const updated = { ...normalizeUser(currentUser), ...data } as User;
      setPortalSession(targetPortal, token, updated);

      if (targetPortal === portal) {
        setUser(updated);
      }
    },
    [portal, user],
  );

  const enterWebsiteAsAdmin = useCallback(() => {
    const didMirror = mirrorAdminSessionToUserPortal();
    if (didMirror) {
      touchAdminActivity();
    }
    return didMirror;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        portal,
        login,
        register,
        requestPhoneOtp,
        verifyPhoneOtp,
        requestEmailOtp,
        verifyEmailOtp,
        completeRegister,
        logout,
        updateProfile,
        setTokenAndUser,
        setPassword,
        enterWebsiteAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
