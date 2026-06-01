import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  ImagePlus,
  MessageSquareHeart,
  Phone,
  Printer,
  Receipt,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  User,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/common/ScrollReveal";
import { apiFetch, BASE_URL, getImageUrl } from "@/services/apiClient";
import { getCurrentAuthPortal, getPortalAccessToken } from "@/services/authSession";
import { useAuth } from "@/contexts/AuthContext";
import { interpolate, useLocale } from "@/contexts/LocaleContext";
import { getAvatarInitial } from "@/utils/user";
import {
  getLocalBookingReview,
  type LocalBookingReview,
  saveLocalBookingReview,
} from "@/services/reviewService";

const MAX_REVIEW_IMAGES = 3;
const MAX_REVIEW_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_REVIEW_VIDEOS = 1;
const MAX_REVIEW_VIDEO_SIZE = 10 * 1024 * 1024;

const formatDate = (value?: string, locale = "vi-VN") =>
  value
    ? new Date(value).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "---";

const formatDateTime = (value?: string, locale = "vi-VN") =>
  value
    ? new Date(value).toLocaleString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "---";

const statusCopy: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: "Chờ xác nhận", className: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  confirmed: { label: "Đã xác nhận", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  checked_in: { label: "Đang lưu trú", className: "border-blue-200 bg-blue-50 text-blue-700", icon: ShieldCheck },
  checked_out: { label: "Đã hoàn tất", className: "border-slate-200 bg-slate-100 text-slate-700", icon: CheckCircle2 },
  cancelled: { label: "Đã hủy", className: "border-red-200 bg-red-50 text-red-700", icon: AlertCircle },
};

const paymentCopy: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: "Chờ thanh toán", className: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  paid: { label: "Đã thanh toán", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  failed: { label: "Thanh toán thất bại", className: "border-red-200 bg-red-50 text-red-700", icon: AlertCircle },
  refunded: { label: "Đã hoàn tiền", className: "border-slate-200 bg-slate-100 text-slate-700", icon: CreditCard },
};

const paymentMethodLabel = (method?: string, language: "vi" | "en" = "vi") => {
  if (method === "ewallet" || method === "momo") return "MoMo";
  if (method === "pay_at_hotel") return language === "en" ? "Pay at hotel" : "Thanh toán tại khách sạn";
  if (method === "card") return language === "en" ? "Bank card" : "Thẻ ngân hàng";
  return method ? method.replace(/_/g, " ") : "---";
};

const getBadge = (map: typeof statusCopy, value?: string) => {
  const key = String(value || "pending").toLowerCase();
  return map[key] || { label: value || "---", className: "border-border bg-muted text-muted-foreground", icon: Clock };
};

const getRoomName = (booking: any, language: "vi" | "en" = "vi") =>
  booking.items?.[0]?.roomNameSnapshot ||
  booking.items?.[0]?.room?.name ||
  booking.roomName ||
  (language === "en" ? "Booked room" : "Phòng đã đặt");

const DetailRow = ({ label, value, strong = false }: { label: string; value: any; strong?: boolean }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`${strong ? "font-bold text-foreground" : "font-semibold"} text-right`}>{value || "---"}</span>
  </div>
);

const getReviewMediaSrc = (src: string) =>
  src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http")
    ? src
    : getImageUrl(src);

const getReviewMediaValue = (item: unknown) => {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object" && "url" in item) return String(item.url || "").trim();
  return "";
};

const normalizeReviewMediaItems = (items: unknown, fallback: string[], limit: number) => {
  const normalized = Array.isArray(items)
    ? items.map(getReviewMediaValue).filter(Boolean).slice(0, limit)
    : [];

  return normalized.length > 0 ? normalized : fallback.slice(0, limit);
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BookingDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { formatCurrency, language, t } = useLocale();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewVideos, setReviewVideos] = useState<string[]>([]);
  const [reviewMediaUploading, setReviewMediaUploading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [localReview, setLocalReview] = useState<LocalBookingReview | null>(null);

  useEffect(() => {
    if (authLoading || !id) return;

    setLoading(true);
    setError("");
    apiFetch(`/bookings/${id}`)
      .then((data) => {
        setBooking(data);
        setLocalReview(getLocalBookingReview(data.id));
      })
      .catch((err) => {
        console.error(err);
        setError(err?.message || (language === "en" ? "Booking not found" : "Không tìm thấy đơn đặt phòng"));
        if (err?.status !== 401) {
          toast.error(language === "en" ? "Could not load booking details" : "Không thể tải chi tiết booking");
        }
      })
      .finally(() => setLoading(false));
  }, [authLoading, id, language]);

  useEffect(() => {
    if (!loading && location.hash === "#review") {
      window.setTimeout(() => {
        document.getElementById("review")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [loading, location.hash]);

  const formatPrice = formatCurrency;
  const dateLocale = language === "en" ? "en-US" : "vi-VN";
  const copy =
    language === "en"
      ? {
          back: "Back to booking history",
          eyebrow: "Order details",
          loadingBooking: "Loading booking",
          subtitle: "Invoice, guest information, stay details and payment status for this booking.",
          print: "Print invoice",
          loading: "Loading order details...",
          cannotOpen: "Could not open order",
          history: "Back to booking history",
          bookingCode: "Booking code",
          qrHint: "Scan this QR code at the hotel to verify booking information.",
          customer: "Guest",
          fullName: "Full name",
          phone: "Phone",
          createdAt: "Created at",
          hotelFallback: "Hotel",
          totalMoney: "Total",
          nights: "Nights",
          roomGuests: "Guests/rooms",
          roomPriceDetails: "Room price details",
          roomPrice: "Room price",
          temporary: "Subtotal",
          paymentReceipt: "Payment receipt",
          paymentMethod: "Method",
          paymentStatus: "Payment status",
          transactionId: "Transaction ID",
          providerRequest: "Gateway request code",
          paidAt: "Payment time",
          roomCharge: "Room charge",
          tax: "Taxes & fees",
          discount: "Discount",
          voucherProgram: "Voucher program",
          voucherValue: "Voucher value",
          totalValue: "Total value",
          paid: "Paid",
          remaining: "Remaining",
          hotelNote: "Hotel note",
          night: "night",
          reviewTitle: "Review your stay",
          reviewDesc: "Share your star rating, photos, one short video and honest experience after the stay is completed.",
          reviewLocked: "You can review this hotel after check-out is completed.",
          yourReview: "Your review",
          editReview: "Edit review",
          ratingLabel: "Overall rating",
          commentLabel: "Your experience",
          commentPlaceholder: "What did you like about the room, service, location or photos?",
          addMedia: "Review media",
          addPhotos: "Add photos",
          addVideo: "Add video",
          reviewMediaHint: "Up to 3 photos and 1 video.",
          submitReview: "Submit review",
          submittingReview: "Submitting...",
          uploadingMedia: "Uploading...",
          reviewSuccess: "Thanks, your review has been submitted.",
          reviewMinComment: "Please write at least 10 characters.",
          reviewImageLimit: "You can upload up to 3 images.",
          reviewImageSize: "Each image must be under 3MB.",
          reviewVideoLimit: "You can upload 1 video at most.",
          reviewVideoSize: "Video must be under 10MB.",
          reviewUploadError: "Could not upload review media.",
          reviewFallbackMedia: "Media upload was interrupted, but the selected file is kept with your review.",
        }
      : {
          back: "Quay lại lịch sử booking",
          eyebrow: "Chi tiết đơn hàng",
          loadingBooking: "Đang tải booking",
          subtitle: "Hóa đơn, thông tin khách hàng, lịch lưu trú và trạng thái thanh toán của đơn đặt phòng.",
          print: "In hóa đơn",
          loading: "Đang tải chi tiết đơn hàng...",
          cannotOpen: "Không thể mở đơn hàng",
          history: "Về lịch sử booking",
          bookingCode: "Mã booking",
          qrHint: "Quét QR để đối chiếu thông tin đặt phòng tại khách sạn.",
          customer: "Khách hàng",
          fullName: "Họ tên",
          phone: "Điện thoại",
          createdAt: "Ngày tạo đơn",
          hotelFallback: "Khách sạn",
          totalMoney: "Tổng tiền",
          nights: "Số đêm",
          roomGuests: "Khách/phòng",
          roomPriceDetails: "Chi tiết giá phòng",
          roomPrice: "Giá phòng",
          temporary: "Tạm tính",
          paymentReceipt: "Biên lai thanh toán",
          paymentMethod: "Phương thức",
          paymentStatus: "Trạng thái thanh toán",
          transactionId: "Mã giao dịch",
          providerRequest: "Mã yêu cầu cổng thanh toán",
          paidAt: "Thời gian thanh toán",
          roomCharge: "Tiền phòng",
          tax: "Thuế và phí",
          discount: "Giảm giá",
          voucherProgram: "Chương trình voucher",
          voucherValue: "Giá trị voucher",
          totalValue: "Tổng giá trị",
          paid: "Đã thanh toán",
          remaining: "Còn lại",
          hotelNote: "Ghi chú từ khách sạn",
          night: "đêm",
          reviewTitle: "Đánh giá kỳ lưu trú",
          reviewDesc: "Chia sẻ số sao, hình ảnh, 1 video ngắn và cảm nhận thật sau khi bạn đã sử dụng dịch vụ.",
          reviewLocked: "Bạn có thể đánh giá khách sạn sau khi hoàn tất trả phòng.",
          yourReview: "Đánh giá của bạn",
          editReview: "Chỉnh sửa đánh giá",
          ratingLabel: "Điểm tổng thể",
          commentLabel: "Trải nghiệm của bạn",
          commentPlaceholder: "Bạn thích điều gì về phòng, dịch vụ, vị trí hoặc hình ảnh thực tế?",
          addMedia: "Hình ảnh và video",
          addPhotos: "Thêm hình ảnh",
          addVideo: "Thêm video",
          reviewMediaHint: "Tối đa 3 ảnh và 1 video.",
          submitReview: "Gửi đánh giá",
          submittingReview: "Đang gửi...",
          uploadingMedia: "Đang tải...",
          reviewSuccess: "Cảm ơn bạn, đánh giá đã được ghi nhận.",
          reviewMinComment: "Vui lòng viết ít nhất 10 ký tự.",
          reviewImageLimit: "Bạn chỉ có thể tải tối đa 3 ảnh.",
          reviewImageSize: "Mỗi ảnh cần nhỏ hơn 3MB.",
          reviewVideoLimit: "Bạn chỉ có thể tải tối đa 1 video.",
          reviewVideoSize: "Video cần nhỏ hơn 10MB.",
          reviewUploadError: "Không thể tải media đánh giá.",
          reviewFallbackMedia: "Upload media bị gián đoạn, hệ thống vẫn giữ file bạn đã chọn trong đánh giá.",
        };

  const badgeLabel = (prefix: "booking.status" | "booking.payment", value?: string) =>
    t(`${prefix}.${String(value || "pending").toLowerCase()}`);

  const computed = useMemo(() => {
    const paidAmount = Number(booking?.payment?.amount || 0);
    const total = Number(booking?.total || 0);
    const remaining = Math.max(0, total - paidAmount);
    const status = { ...getBadge(statusCopy, booking?.status), label: badgeLabel("booking.status", booking?.status) };
    const payment = { ...getBadge(paymentCopy, booking?.paymentStatus), label: badgeLabel("booking.payment", booking?.paymentStatus) };
    const roomName = booking ? getRoomName(booking, language) : "---";
    const qrPayload = booking
      ? JSON.stringify({
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          guestName: booking.guestName,
          guestPhone: booking.guestPhone,
          hotel: booking.hotel?.name || booking.hotelNameSnapshot,
          room: roomName,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          total: booking.total,
          paidAmount,
          paymentStatus: booking.paymentStatus,
          transactionId: booking.transactionId || booking.payment?.transactionId || "",
        })
      : "";

    return {
      paidAmount,
      total,
      remaining,
      status,
      payment,
      roomName,
      qrUrl: qrPayload
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`
        : "",
    };
  }, [booking, language, t]);

  const StatusIcon = computed.status.icon;
  const PaymentIcon = computed.payment.icon;
  const canReview =
    Boolean(booking) &&
    String(booking?.status || "").toLowerCase() !== "cancelled" &&
    (String(booking?.status || "").toLowerCase() === "checked_out" ||
      (booking?.checkOut && new Date(booking.checkOut).getTime() <= Date.now()));
  const promotion = booking?.promotion;
  const promotionCode = promotion?.code || booking?.promoCode || "";
  const promotionValue = promotion
    ? promotion.discountType === "percent" && Number(promotion.discountValue || 0) <= 100
      ? `${Number(promotion.discountValue || 0)}%`
      : formatPrice(Number(promotion.discountValue || 0))
    : "";

  const uploadReviewMedia = async (files: File[]) => {
    const mediaData = new FormData();
    files.forEach((file) => mediaData.append("files", file));

    const portal = getCurrentAuthPortal();
    const token = getPortalAccessToken(portal);
    const response = await fetch(`${BASE_URL}/api/upload/review-media`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: mediaData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || copy.reviewUploadError);
    }

    const data = await response.json();
    return Array.isArray(data)
      ? data
          .map((item: any) => String(item.url || ""))
          .filter(Boolean)
      : [];
  };

  const handleReviewImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = "";

    if (!files.length || reviewMediaUploading) return;

    if (reviewImages.length + files.length > MAX_REVIEW_IMAGES) {
      toast.error(copy.reviewImageLimit);
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > MAX_REVIEW_IMAGE_SIZE);
    if (invalidFile) {
      toast.error(copy.reviewImageSize);
      return;
    }

    setReviewMediaUploading(true);
    try {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      setReviewImages((prev) => [...prev, ...dataUrls].slice(0, MAX_REVIEW_IMAGES));
      const uploadedUrls = await uploadReviewMedia(files);
      setReviewImages((prev) => {
        const next = [...prev];
        dataUrls.forEach((dataUrl, index) => {
          const position = next.indexOf(dataUrl);
          if (position >= 0 && uploadedUrls[index]) {
            next[position] = uploadedUrls[index];
          }
        });
        return next.slice(0, MAX_REVIEW_IMAGES);
      });
    } catch {
      toast.warning(copy.reviewFallbackMedia);
    } finally {
      setReviewMediaUploading(false);
    }
  };

  const handleReviewVideoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = "";

    if (!files.length || reviewMediaUploading) return;

    if (reviewVideos.length >= MAX_REVIEW_VIDEOS || files.length > MAX_REVIEW_VIDEOS) {
      toast.error(copy.reviewVideoLimit);
      return;
    }

    const file = files[0];
    if (!file.type.startsWith("video/") || file.size > MAX_REVIEW_VIDEO_SIZE) {
      toast.error(copy.reviewVideoSize);
      return;
    }

    setReviewMediaUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setReviewVideos([dataUrl]);
      const uploadedUrls = await uploadReviewMedia([file]);
      setReviewVideos(uploadedUrls.length ? uploadedUrls.slice(0, MAX_REVIEW_VIDEOS) : [dataUrl]);
    } catch {
      toast.warning(copy.reviewFallbackMedia);
    } finally {
      setReviewMediaUploading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!booking || !canReview || reviewSubmitting || reviewMediaUploading) return;

    const trimmedComment = reviewComment.trim();
    if (trimmedComment.length < 10) {
      toast.error(copy.reviewMinComment);
      return;
    }

    try {
      setReviewSubmitting(true);
      const submittedImages = reviewImages.slice(0, MAX_REVIEW_IMAGES);
      const submittedVideos = reviewVideos.slice(0, MAX_REVIEW_VIDEOS);
      const response = await apiFetch(`/bookings/${booking.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          rating: reviewRating,
          comment: trimmedComment,
          images: submittedImages,
          videos: submittedVideos,
        }),
      });
      const savedImages = normalizeReviewMediaItems(response.images, submittedImages, MAX_REVIEW_IMAGES);
      const savedVideos = normalizeReviewMediaItems(response.videos, submittedVideos, MAX_REVIEW_VIDEOS);

      const savedReview: LocalBookingReview = {
        id: response.id || `local-${booking.id}`,
        bookingId: response.bookingId || booking.id,
        hotelId: booking.hotel?.id || booking.hotelId,
        hotelName: response.hotelName || booking.hotel?.name || booking.hotelNameSnapshot,
        userName: response.userName || user?.name || booking.guestName,
        avatar: response.avatar || response.user?.avatar || getAvatarInitial(user) || "G",
        rating: Number(response.rating || reviewRating),
        comment: response.comment || trimmedComment,
        images: savedImages,
        videos: savedVideos,
        createdAt: response.createdAt || new Date().toISOString(),
      };

      saveLocalBookingReview(savedReview);
      setLocalReview(savedReview);
      setReviewComment("");
      setReviewImages([]);
      setReviewVideos([]);
      setReviewRating(5);
      toast.success(copy.reviewSuccess);
    } catch (err: any) {
      toast.error(err?.message || (language === "en" ? "Could not submit review" : "Không thể gửi đánh giá"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleEditReview = () => {
    if (!localReview) return;

    setReviewRating(Number(localReview.rating || 5));
    setReviewComment(localReview.comment || "");
    setReviewImages(normalizeReviewMediaItems(localReview.images, [], MAX_REVIEW_IMAGES));
    setReviewVideos(normalizeReviewMediaItems(localReview.videos, [], MAX_REVIEW_VIDEOS));
    setLocalReview(null);
  };

  const localReviewImages = localReview
    ? normalizeReviewMediaItems(localReview.images, [], MAX_REVIEW_IMAGES)
    : [];
  const localReviewVideos = localReview
    ? normalizeReviewMediaItems(localReview.videos, [], MAX_REVIEW_VIDEOS)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-10 md:py-12">
            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-gold"
            >
              <ArrowLeft className="w-4 h-4" />
              {copy.back}
            </Link>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">{copy.eyebrow}</p>
                <h1 className="mt-3 font-heading text-3xl md:text-4xl font-bold">
                  {booking?.bookingCode || copy.loadingBooking}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {copy.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!booking}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary shadow-luxury transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer className="w-4 h-4" />
                {copy.print}
              </button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-10">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <Loader2 className="mx-auto w-8 h-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-muted-foreground">{copy.loading}</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <AlertCircle className="mx-auto w-10 h-10 text-red-500" />
              <h2 className="mt-4 font-heading text-2xl font-bold">{copy.cannotOpen}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Link
                to="/my-bookings"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary"
              >
                {copy.history}
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
              <ScrollReveal direction="left">
                <aside className="space-y-6">
                  <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.bookingCode}</p>
                      <p className="mt-1 font-mono text-2xl font-bold text-gold">{booking.bookingCode || booking.id}</p>
                      <div className="mt-5 inline-block rounded-lg border border-border bg-white p-3 shadow-sm">
                        <img src={computed.qrUrl} alt="Booking QR" className="h-52 w-52" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{copy.qrHint}</p>
                    </div>

                    <div className="mt-6 grid gap-3">
                      <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${computed.status.className}`}>
                        <StatusIcon className="w-4 h-4" />
                        {computed.status.label}
                      </div>
                      <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${computed.payment.className}`}>
                        <PaymentIcon className="w-4 h-4" />
                        {computed.payment.label}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
                      <User className="w-5 h-5 text-gold" />
                      {copy.customer}
                    </h2>
                    <div className="mt-4">
                      <DetailRow label={copy.fullName} value={booking.guestName} strong />
                      <DetailRow
                        label="Email"
                        value={
                          <span className="inline-flex items-center justify-end gap-1 break-all">
                            <Mail className="w-3.5 h-3.5 text-gold" />
                            {booking.guestEmail}
                          </span>
                        }
                      />
                      <DetailRow
                        label={copy.phone}
                        value={
                          <span className="inline-flex items-center justify-end gap-1">
                            <Phone className="w-3.5 h-3.5 text-gold" />
                            {booking.guestPhone}
                          </span>
                        }
                      />
                      <DetailRow label={copy.createdAt} value={formatDateTime(booking.createdAt, dateLocale)} />
                    </div>
                  </section>
                </aside>
              </ScrollReveal>

              <div className="space-y-6">
                <ScrollReveal>
                  <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="font-heading text-2xl font-bold">
                          {booking.hotel?.name || booking.hotelNameSnapshot || copy.hotelFallback}
                        </h2>
                        <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                          <BedDouble className="w-4 h-4 text-gold" />
                          {computed.roomName}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gold/10 px-4 py-3 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.totalMoney}</p>
                        <p className="text-2xl font-bold text-gold">{formatPrice(computed.total)}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border border-border p-4">
                        <CalendarDays className="w-5 h-5 text-gold" />
                        <p className="mt-2 text-xs text-muted-foreground">Check-in</p>
                        <p className="font-semibold">{formatDate(booking.checkIn, dateLocale)}</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <CalendarDays className="w-5 h-5 text-gold" />
                        <p className="mt-2 text-xs text-muted-foreground">Check-out</p>
                        <p className="font-semibold">{formatDate(booking.checkOut, dateLocale)}</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <Clock className="w-5 h-5 text-gold" />
                        <p className="mt-2 text-xs text-muted-foreground">{copy.nights}</p>
                        <p className="font-semibold">{booking.nights || 0} {copy.night}</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <Users className="w-5 h-5 text-gold" />
                        <p className="mt-2 text-xs text-muted-foreground">{copy.roomGuests}</p>
                        <p className="font-semibold">
                          {interpolate(t("hotels.guestCount"), { count: booking.guests || 0 })} - {interpolate(t("hotels.roomCount"), { count: booking.roomsCount || 0 })}
                        </p>
                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal direction="right">
                  <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
                      <Receipt className="w-5 h-5 text-gold" />
                      {copy.roomPriceDetails}
                    </h2>

                    <div className="mt-4 overflow-hidden rounded-lg border border-border">
                      {(booking.items || []).map((item: any, index: number) => (
                        <div
                          key={item.id || index}
                          className="grid gap-3 border-b border-border p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_120px_120px_150px]"
                        >
                          <div>
                            <p className="font-semibold">{item.roomNameSnapshot || item.room?.name || computed.roomName}</p>
                            <p className="text-sm text-muted-foreground">
                              {interpolate(t("hotels.roomCount"), { count: item.roomsCount || booking.roomsCount || 0 })}, {item.nights || booking.nights || 0} {copy.night}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.roomPrice}</p>
                            <p className="font-semibold">{formatPrice(Number(item.roomPriceSnapshot || 0))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.roomGuests}</p>
                            <p className="font-semibold">{item.guestsPerRoom || "---"}</p>
                          </div>
                          <div className="md:text-right">
                            <p className="text-xs text-muted-foreground">{copy.temporary}</p>
                            <p className="font-bold">{formatPrice(Number(item.lineSubtotal || booking.subtotal || 0))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal>
                  <section className="rounded-xl border border-border bg-card p-6 shadow-luxury">
                    <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
                      <Wallet className="w-5 h-5 text-gold" />
                      {copy.paymentReceipt}
                    </h2>

                    <div className="mt-4 grid gap-6 lg:grid-cols-2">
                      <div>
                        <DetailRow label={copy.paymentMethod} value={paymentMethodLabel(booking.paymentMethod, language)} strong />
                        <DetailRow label={copy.paymentStatus} value={computed.payment.label} />
                        <DetailRow label={copy.transactionId} value={booking.transactionId || booking.payment?.transactionId || "---"} />
                        <DetailRow label={copy.providerRequest} value={booking.payment?.providerReference || "---"} />
                        <DetailRow label={copy.paidAt} value={formatDateTime(booking.payment?.paidAt, dateLocale)} />
                      </div>

                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <DetailRow label={copy.roomCharge} value={formatPrice(Number(booking.subtotal || 0))} />
                        <DetailRow label={copy.tax} value={formatPrice(Number(booking.tax || 0))} />
                        {Number(booking.discount || 0) > 0 && (
                          <>
                            <DetailRow
                              label={promotionCode ? `${copy.discount} (${promotionCode})` : copy.discount}
                              value={`-${formatPrice(Number(booking.discount || 0))}`}
                            />
                            {promotion?.title && <DetailRow label={copy.voucherProgram} value={promotion.title} />}
                            {promotionValue && <DetailRow label={copy.voucherValue} value={promotionValue} />}
                          </>
                        )}
                        <DetailRow label={copy.totalValue} value={formatPrice(computed.total)} strong />
                        <DetailRow label={copy.paid} value={formatPrice(computed.paidAmount)} />
                        {computed.remaining > 0 && <DetailRow label={copy.remaining} value={formatPrice(computed.remaining)} />}
                      </div>
                    </div>

                    {booking.adminNote && (
                      <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
                        <p className="text-sm font-semibold">{copy.hotelNote}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{booking.adminNote}</p>
                      </div>
                    )}
                  </section>
                </ScrollReveal>

                <ScrollReveal>
                  <section id="review" className="rounded-xl border border-border bg-card p-6 shadow-luxury">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
                          <MessageSquareHeart className="h-5 w-5 text-gold" />
                          {copy.reviewTitle}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">{copy.reviewDesc}</p>
                      </div>
                      <div className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-bold ${
                        canReview ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {canReview ? computed.status.label : copy.reviewLocked}
                      </div>
                    </div>

                    {localReview ? (
                      <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-bold text-foreground">{copy.yourReview}</p>
                          <button
                            type="button"
                            onClick={handleEditReview}
                            className="rounded-lg border border-gold/30 bg-white px-3 py-2 text-xs font-bold text-gold transition hover:bg-gold/10"
                          >
                            {copy.editReview}
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-5 w-5 ${index < localReview.rating ? "fill-gold text-gold" : "text-slate-300"}`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold text-muted-foreground">{localReview.rating}/5</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{localReview.comment}</p>
                        {(localReviewImages.length > 0 || localReviewVideos.length > 0) && (
                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {localReviewImages.map((image, index) => (
                              <img
                                key={`${localReview.id}-${index}`}
                                src={getReviewMediaSrc(image)}
                                alt=""
                                className="h-28 w-full rounded-xl object-cover"
                              />
                            ))}
                            {localReviewVideos.map((video, index) => (
                              <video
                                key={`${localReview.id}-video-${index}`}
                                src={getReviewMediaSrc(video)}
                                controls
                                preload="metadata"
                                className="h-28 w-full rounded-xl bg-slate-950 object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : canReview ? (
                      <div className="mt-6 space-y-5">
                        <div>
                          <p className="mb-2 text-sm font-semibold">{copy.ratingLabel}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const star = index + 1;
                              const active = star <= reviewRating;

                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className={`rounded-xl border p-2 transition ${
                                    active
                                      ? "border-gold bg-gold/10 text-gold"
                                      : "border-border bg-background text-slate-300 hover:border-gold/40 hover:text-gold"
                                  }`}
                                  aria-label={`${star} sao`}
                                >
                                  <Star className={`h-6 w-6 ${active ? "fill-current" : ""}`} />
                                </button>
                              );
                            })}
                            <span className="ml-1 text-sm font-bold text-gold">{reviewRating}/5</span>
                          </div>
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold">{copy.commentLabel}</span>
                          <textarea
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            placeholder={copy.commentPlaceholder}
                            rows={5}
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                          />
                        </label>

                        <div>
                          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold">{copy.addMedia}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{copy.reviewMediaHint}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <label
                                className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:border-gold hover:text-gold ${
                                  reviewImages.length >= MAX_REVIEW_IMAGES || reviewMediaUploading ? "pointer-events-none opacity-60" : ""
                                }`}
                              >
                                <ImagePlus className="h-4 w-4" />
                                {copy.addPhotos}
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleReviewImageChange}
                                  className="hidden"
                                />
                              </label>
                              <label
                                className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:border-gold hover:text-gold ${
                                  reviewVideos.length >= MAX_REVIEW_VIDEOS || reviewMediaUploading ? "pointer-events-none opacity-60" : ""
                                }`}
                              >
                                <Video className="h-4 w-4" />
                                {copy.addVideo}
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleReviewVideoChange}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {reviewMediaUploading && (
                            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {copy.uploadingMedia}
                            </div>
                          )}

                          {(reviewImages.length > 0 || reviewVideos.length > 0) && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {reviewImages.map((image, index) => (
                                <div key={image.slice(0, 80)} className="group relative overflow-hidden rounded-xl border border-border">
                                  <img src={getReviewMediaSrc(image)} alt="" className="h-28 w-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setReviewImages((prev) => prev.filter((_, i) => i !== index))}
                                    className="absolute right-2 top-2 rounded-full bg-slate-950/70 p-2 text-white opacity-0 transition group-hover:opacity-100"
                                    aria-label={language === "en" ? "Remove photo" : "Xóa ảnh"}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              {reviewVideos.map((video, index) => (
                                <div key={video.slice(0, 80)} className="group relative overflow-hidden rounded-xl border border-border sm:col-span-2">
                                  <video
                                    src={getReviewMediaSrc(video)}
                                    controls
                                    preload="metadata"
                                    className="h-36 w-full bg-slate-950 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setReviewVideos((prev) => prev.filter((_, i) => i !== index))}
                                    className="absolute right-2 top-2 rounded-full bg-slate-950/70 p-2 text-white opacity-0 transition group-hover:opacity-100"
                                    aria-label={language === "en" ? "Remove video" : "Xóa video"}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleSubmitReview}
                          disabled={reviewSubmitting || reviewMediaUploading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary shadow-luxury transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reviewSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          {reviewSubmitting ? copy.submittingReview : copy.submitReview}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                        {copy.reviewLocked}
                      </div>
                    )}
                  </section>
                </ScrollReveal>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingDetailPage;
