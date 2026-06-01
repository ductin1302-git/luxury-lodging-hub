import { apiFetch } from "./apiClient";

export const authService = {
  async login(credentials: any) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  async register(data: any) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return apiFetch("/auth/me");
  },

  async refresh() {
    return apiFetch("/auth/refresh", {
      method: "POST",
    });
  },

  async requestOtp(phone: string) {
    return apiFetch("/auth/phone/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(phone: string, otp: string) {
    return apiFetch("/auth/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
  },

  async requestEmailOtp(email: string) {
    return apiFetch("/auth/register/request-email-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyEmailOtp(email: string, otp: string) {
    return apiFetch("/auth/register/verify-email-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  async completeRegistration(data: any) {
    return apiFetch("/auth/register/complete", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProfile(data: any) {
    return apiFetch("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: any) {
    return apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async setPassword(data: any) {
    return apiFetch("/auth/set-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async requestPasswordReset(email: string) {
    return apiFetch("/auth/forgot-password/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: any) {
    return apiFetch("/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
