import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BedDouble,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Loader2,
  MessageSquareHeart,
  Search,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/common/ScrollReveal";
import { apiFetch, getImageUrl } from "@/services/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { interpolate, useLocale } from "@/contexts/LocaleContext";
import {
  canReviewBooking,
  getLocalBookingReview,
  getPendingReviewBookings,
  REVIEWS_CHANGED_EVENT,
} from "@/services/reviewService";

const formatDate = (value?: string, language: "vi" | "en" = "vi") =>
  value
    ? new Date(value).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "---";

const statusCopy: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "border-amber-200 bg-amber-50 text-amber-700" },
  confirmed: { label: "Đã xác nhận", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  checked_in: { label: "Đang lưu trú", className: "border-blue-200 bg-blue-50 text-blue-700" },
  checked_out: { label: "Đã hoàn tất", className: "border-slate-200 bg-slate-100 text-slate-700" },
  cancelled: { label: "Đã hủy", className: "border-red-200 bg-red-50 text-red-700" },
};

const paymentCopy: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ thanh toán", className: "border-amber-200 bg-amber-50 text-amber-700" },
  paid: { label: "Đã thanh toán", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failed: { label: "Thất bại", className: "border-red-200 bg-red-50 text-red-700" },
  refunded: { label: "Đã hoàn tiền", className: "border-slate-200 bg-slate-100 text-slate-700" },
};

const paymentMethodLabel = (method?: string, language: "vi" | "en" = "vi") => {
  if (method === "ewallet" || method === "momo") return "MoMo";
  if (method === "pay_at_hotel") return language === "en" ? "Pay at hotel" : "Tại khách sạn";
  if (method === "card") return language === "en" ? "Bank card" : "Thẻ ngân hàng";
  return method ? method.replace(/_/g, " ") : "---";
};

const getRoomName = (booking: any, language: "vi" | "en" = "vi") =>
  booking.items?.[0]?.roomNameSnapshot ||
  booking.items?.[0]?.room?.name ||
  booking.roomName ||
  (language === "en" ? "Booked room" : "Phòng đã đặt");

const getHotelImage = (booking: any) => {
  const firstImage = Array.isArray(booking.hotel?.images) ? booking.hotel.images[0] : booking.hotel?.images;
  return getImageUrl(firstImage);
};

const badgeFor = (map: typeof statusCopy, value?: string) => {
  const key = String(value || "pending").toLowerCase();
  return map[key] || { label: value || "---", className: "border-border bg-muted text-muted-foreground" };
};

const BookingHistoryPage = () => {
  const { isLoading: authLoading } = useAuth();
  const { formatCurrency, language, t } = useLocale();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(() => searchParams.get("filter") || "all");
  const [reviewVersion, setReviewVersion] = useState(0);

  useEffect(() => {
    setFilter(searchParams.get("filter") || "all");
  }, [searchParams]);

  useEffect(() => {
    const handleReviewChange = () => setReviewVersion((value) => value + 1);
    window.addEventListener(REVIEWS_CHANGED_EVENT, handleReviewChange);
    window.addEventListener("storage", handleReviewChange);

    return () => {
      window.removeEventListener(REVIEWS_CHANGED_EVENT, handleReviewChange);
      window.removeEventListener("storage", handleReviewChange);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    apiFetch("/bookings/my-bookings")
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        if (err?.status !== 401) {
          toast.error(language === "en" ? "Could not load booking history" : "Không thể tải lịch sử booking");
        }
      })
      .finally(() => setLoading(false));
  }, [authLoading, language]);

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const now = new Date();

    return bookings.filter((booking) => {
      const status = String(booking.status || "").toLowerCase();
      const paymentStatus = String(booking.paymentStatus || "").toLowerCase();
      const checkIn = booking.checkIn ? new Date(booking.checkIn) : null;
      const checkOut = booking.checkOut ? new Date(booking.checkOut) : null;

      const matchesFilter =
        filter === "all" ||
        (filter === "upcoming" && status !== "cancelled" && checkIn && checkIn >= now) ||
        (filter === "completed" && checkOut && checkOut < now && status !== "cancelled") ||
        (filter === "need_review" && canReviewBooking(booking) && !getLocalBookingReview(booking.id)) ||
        (filter === "pending" && (status === "pending" || paymentStatus === "pending")) ||
        (filter === "paid" && paymentStatus === "paid") ||
        (filter === "cancelled" && status === "cancelled");

      if (!matchesFilter) return false;

      if (!keyword) return true;
      const haystack = [
        booking.bookingCode,
        booking.id,
        booking.guestName,
        booking.guestPhone,
        booking.hotel?.name,
        booking.hotelNameSnapshot,
        getRoomName(booking, language),
        booking.transactionId,
        booking.payment?.transactionId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [bookings, filter, language, reviewVersion, search]);

  const summary = useMemo(() => {
    const paid = bookings.filter((item) => item.paymentStatus === "paid");
    const pending = bookings.filter((item) => item.status === "pending" || item.paymentStatus === "pending");
    const totalPaid = paid.reduce((sum, item) => sum + Number(item.payment?.amount || item.total || 0), 0);
    const pendingReviews = getPendingReviewBookings(bookings).length;
    const reviewed = bookings.filter((item) => getLocalBookingReview(item.id)).length;

    return {
      total: bookings.length,
      paid: paid.length,
      pending: pending.length,
      totalPaid,
      pendingReviews,
      reviewed,
    };
  }, [bookings, reviewVersion]);

  const formatPrice = formatCurrency;
  const copy =
    language === "en"
      ? {
          eyebrow: "My orders",
          title: "Booking history",
          subtitle: "Track every reservation, payment status, and detailed invoice for each booking.",
          profile: "Profile",
          pending: "Pending",
          recorded: "Recorded",
          search: "Search by booking code, hotel, phone number...",
          all: "All",
          upcoming: "Upcoming",
          processing: "Processing",
          paid: "Paid",
          completed: "Completed",
          needReview: "Need review",
          cancelled: "Cancelled",
          loading: "Loading booking history...",
          emptyTitle: "No matching bookings",
          emptyHint: "Try changing filters or reserve a new room for your next trip.",
          totalValue: "Total value",
          paidAmount: "Paid",
          remaining: "Remaining",
          details: "Order details",
          hotelFallback: "Hotel",
          night: "night",
          writeReview: "Write review",
          reviewed: "Reviewed",
          reviewPending: "Awaiting review",
        }
      : {
          eyebrow: "Đơn hàng của tôi",
          title: "Lịch sử booking",
          subtitle: "Theo dõi tất cả đơn đặt phòng, trạng thái thanh toán và xem hóa đơn chi tiết riêng cho từng booking.",
          profile: "Hồ sơ cá nhân",
          pending: "Đang chờ",
          recorded: "Đã ghi nhận",
          search: "Tìm theo mã booking, khách sạn, số điện thoại...",
          all: "Tất cả",
          upcoming: "Sắp tới",
          processing: "Chờ xử lý",
          paid: "Đã thanh toán",
          completed: "Đã hoàn tất",
          needReview: "Cần đánh giá",
          cancelled: "Đã hủy",
          loading: "Đang tải lịch sử booking...",
          emptyTitle: "Không có booking phù hợp",
          emptyHint: "Thử đổi bộ lọc hoặc đặt phòng mới để bắt đầu lịch trình tiếp theo.",
          totalValue: "Tổng giá trị",
          paidAmount: "Đã thanh toán",
          remaining: "Còn lại",
          details: "Chi tiết đơn",
          hotelFallback: "Khách sạn",
          night: "đêm",
          writeReview: "Đánh giá",
          reviewed: "Đã đánh giá",
          reviewPending: "Chờ đánh giá",
        };

  const filterTabs = [
    { id: "all", label: copy.all },
    { id: "upcoming", label: copy.upcoming },
    { id: "pending", label: copy.processing },
    { id: "paid", label: copy.paid },
    { id: "completed", label: copy.completed },
    { id: "need_review", label: copy.needReview },
    { id: "cancelled", label: copy.cancelled },
  ];

  const badgeLabel = (prefix: "booking.status" | "booking.payment", value?: string) =>
    t(`${prefix}.${String(value || "pending").toLowerCase()}`);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-10 md:py-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">{copy.eyebrow}</p>
                <h1 className="mt-3 font-heading text-3xl md:text-4xl font-bold">{copy.title}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {copy.subtitle}
                </p>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:border-gold hover:text-gold"
              >
                {copy.profile}
              </Link>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("profile.totalBookings")}</p>
                  <p className="mt-2 text-2xl font-bold">{loading ? "--" : summary.total}</p>
                </div>
                <ClipboardList className="w-6 h-6 text-gold" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{copy.reviewPending}</p>
                  <p className="mt-2 text-2xl font-bold">{loading ? "--" : summary.pendingReviews}</p>
                </div>
                <MessageSquareHeart className="w-6 h-6 text-rose-500" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("profile.paidOrders")}</p>
                  <p className="mt-2 text-2xl font-bold">{loading ? "--" : summary.paid}</p>
                </div>
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{copy.pending}</p>
                  <p className="mt-2 text-2xl font-bold">{loading ? "--" : summary.pending}</p>
                </div>
                <CalendarDays className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{copy.recorded}</p>
                  <p className="mt-2 text-lg font-bold text-gold">{loading ? "--" : formatPrice(summary.totalPaid)}</p>
                </div>
                <Wallet className="w-6 h-6 text-gold" />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.search}
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                {filterTabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      filter === item.id
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground hover:border-gold hover:text-gold"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
                <Loader2 className="mx-auto w-8 h-8 animate-spin text-gold" />
                <p className="mt-3 text-sm text-muted-foreground">{copy.loading}</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
                <ClipboardList className="mx-auto w-10 h-10 text-muted-foreground" />
                <h2 className="mt-4 font-heading text-2xl font-bold">{copy.emptyTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{copy.emptyHint}</p>
                <Link
                  to="/hotels"
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary"
                >
                  {t("profile.findHotel")}
                </Link>
              </div>
            ) : (
              filteredBookings.map((booking, index) => {
                const status = {
                  ...badgeFor(statusCopy, booking.status),
                  label: badgeLabel("booking.status", booking.status),
                };
                const payment = {
                  ...badgeFor(paymentCopy, booking.paymentStatus),
                  label: badgeLabel("booking.payment", booking.paymentStatus),
                };
                const paidAmount = Number(booking.payment?.amount || 0);
                const remaining = Math.max(0, Number(booking.total || 0) - paidAmount);
                const localReview = getLocalBookingReview(booking.id);
                const canReview = canReviewBooking(booking);

                return (
                  <ScrollReveal key={booking.id} delay={Math.min(index + 1, 4) as 1 | 2 | 3 | 4}>
                    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-gold/50 hover:shadow-luxury">
                      <div className="grid gap-0 md:grid-cols-[190px_minmax(0,1fr)]">
                        <img
                          src={getHotelImage(booking)}
                          alt={booking.hotel?.name || booking.hotelNameSnapshot || "Hotel"}
                          className="h-44 w-full object-cover md:h-full"
                        />

                        <div className="p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-muted-foreground">
                                  {booking.bookingCode || booking.id}
                                </span>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                                  {status.label}
                                </span>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${payment.className}`}>
                                  {payment.label}
                                </span>
                                {localReview ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {copy.reviewed}
                                  </span>
                                ) : canReview ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    {copy.reviewPending}
                                  </span>
                                ) : null}
                              </div>
                              <h2 className="mt-3 font-heading text-2xl font-bold">
                                {booking.hotel?.name || booking.hotelNameSnapshot || copy.hotelFallback}
                              </h2>
                              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <BedDouble className="w-4 h-4 text-gold" />
                                {getRoomName(booking, language)}
                              </p>
                            </div>

                            <div className="lg:text-right">
                              <p className="text-sm text-muted-foreground">{copy.totalValue}</p>
                              <p className="text-xl font-bold text-gold">{formatPrice(Number(booking.total || 0))}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{paymentMethodLabel(booking.paymentMethod, language)}</p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">Check-in</p>
                              <p className="font-semibold">{formatDate(booking.checkIn, language)}</p>
                            </div>
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">Check-out</p>
                              <p className="font-semibold">{formatDate(booking.checkOut, language)}</p>
                            </div>
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">{t("booking.guestRoom")}</p>
                              <p className="font-semibold">
                                {interpolate(t("hotels.guestCount"), { count: booking.guests || 0 })} - {interpolate(t("hotels.roomCount"), { count: booking.roomsCount || 0 })}
                              </p>
                            </div>
                            <div className="rounded-lg bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">{copy.paidAmount}</p>
                              <p className="font-semibold">{paidAmount > 0 ? formatPrice(paidAmount) : "---"}</p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="w-4 h-4" />
                                {booking.nights || 0} {copy.night}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {interpolate(t("hotels.guestCount"), { count: booking.guests || 0 })}
                              </span>
                              {paidAmount > 0 && remaining > 0 && <span>{copy.remaining}: {formatPrice(remaining)}</span>}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              {localReview ? (
                                <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {copy.reviewed}
                                </span>
                              ) : canReview && (
                                <Link
                                  to={`/my-bookings/${booking.id}#review`}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold hover:text-primary"
                                >
                                  <Star className="h-4 w-4 fill-current" />
                                  {copy.writeReview}
                                </Link>
                              )}
                              <Link
                                to={`/my-bookings/${booking.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                              >
                                {copy.details}
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingHistoryPage;
