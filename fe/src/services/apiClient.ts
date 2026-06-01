import {
  clearAdminActivity,
  clearAdminMirrorFromUserPortal,
  clearPortalSession,
  getCurrentAuthPortal,
  getPortalAccessToken,
  getPortalStoredUser,
} from "@/services/authSession";

export const BASE_URL = "https://luxury-lodging-hub.onrender.com".replace(/\/+$/, "");
const API_BASE_URL = `${BASE_URL}/api`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const getImageUrl = (url: any) => {
  const highResParams = "?auto=format&fit=crop&q=100&w=2560";
  const fallbackUrl = `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb${highResParams}`;

  if (!url) return fallbackUrl;
  const imagePath = typeof url === "string" ? url : url.url;
  if (!imagePath) return fallbackUrl;

  if (imagePath.startsWith("http")) {
    if (imagePath.includes("unsplash.com")) {
      const baseUrl = imagePath.split("?")[0];
      return `${baseUrl}${highResParams}`;
    }

    if (imagePath.includes("picsum.photos")) {
      return imagePath.replace(/\/\d+\/\d+/, "/2560/1440");
    }

    return imagePath;
  }

  let normalizedPath = imagePath.replace(/\\/g, "/");
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/images/")) {
    return fallbackUrl;
  }

  return `${BASE_URL}${normalizedPath}`;
};

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const portal = getCurrentAuthPortal();
  const token = getPortalAccessToken(portal);
  const isPublicAuthEndpoint =
    endpoint === "/auth/login" ||
    endpoint === "/auth/register" ||
    endpoint.startsWith("/auth/register/") ||
    endpoint.startsWith("/auth/forgot-password/") ||
    endpoint.startsWith("/auth/phone/");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Global 401 handler: token expired/invalid → clear session and redirect to login
    if (response.status === 401 && !isPublicAuthEndpoint) {
      const portalUser = getPortalStoredUser(portal);
      clearPortalSession(portal);
      if (portal === "admin") {
        clearAdminMirrorFromUserPortal(portalUser?.id);
        clearAdminActivity();
      }

      const loginPath = portal === "admin" ? "/LoginAdmin/admin" : "/auth";
      if (
        window.location.pathname !== loginPath
      ) {
        window.location.href = loginPath;
      }
    }

    throw new ApiError(errorData.message || "Something went wrong", response.status);
  }

  return response.json();
}
