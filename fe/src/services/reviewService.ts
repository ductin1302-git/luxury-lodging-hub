export interface LocalBookingReview {
  id: string;
  bookingId: string;
  hotelId: string;
  hotelName?: string;
  userName: string;
  avatar?: string;
  rating: number;
  comment: string;
  images: string[];
  videos?: string[];
  createdAt: string;
}

const REVIEW_STORAGE_KEY = "luxstay_booking_reviews_v1";
export const REVIEWS_CHANGED_EVENT = "luxstay-booking-reviews-change";

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const readStore = (): Record<string, LocalBookingReview> => {
  if (!canUseStorage()) return {};

  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: Record<string, LocalBookingReview>) => {
  if (!canUseStorage()) return;
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(REVIEWS_CHANGED_EVENT));
};

export const getLocalBookingReview = (bookingId?: string | null) => {
  if (!bookingId) return null;
  return readStore()[bookingId] || null;
};

const getMediaValue = (item: unknown) => {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object" && "url" in item) return String(item.url || "").trim();
  return "";
};

const normalizeMediaList = (value: unknown, limit: number) =>
  Array.isArray(value)
    ? value
        .map(getMediaValue)
        .filter(Boolean)
        .slice(0, limit)
    : [];

export const saveLocalBookingReview = (review: LocalBookingReview) => {
  const normalizedReview = {
    ...review,
    images: normalizeMediaList(review.images, 3),
    videos: normalizeMediaList(review.videos, 1),
  };

  writeStore({
    ...readStore(),
    [review.bookingId]: normalizedReview,
  });
};

export const canReviewBooking = (booking: any) => {
  if (!booking) return false;

  const status = String(booking.status || "").toLowerCase();
  if (status === "cancelled") return false;
  if (status === "checked_out") return true;

  const checkOut = booking.checkOut ? new Date(booking.checkOut) : null;
  return Boolean(checkOut && Number.isFinite(checkOut.getTime()) && checkOut.getTime() <= Date.now());
};

export const hasLocalBookingReview = (bookingId?: string | null) =>
  Boolean(getLocalBookingReview(bookingId));

export const getPendingReviewBookings = (bookings: any[]) =>
  bookings.filter((booking) => canReviewBooking(booking) && !hasLocalBookingReview(booking.id));
