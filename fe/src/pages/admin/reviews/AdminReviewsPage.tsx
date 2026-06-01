import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch, getImageUrl } from "@/services/apiClient";

interface AdminReview {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelCity?: string;
  hotelImage?: string | null;
  userName: string;
  userEmail?: string | null;
  avatar?: string | null;
  rating: number;
  comment: string;
  reviewDate: string;
  createdAt: string;
  isVisible: boolean;
}

interface ReviewStats {
  total: number;
  visible: number;
  hidden: number;
  lowRating: number;
  averageRating: number;
}

interface ReviewMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialStats: ReviewStats = {
  total: 0,
  visible: 0,
  hidden: 0,
  lowRating: 0,
  averageRating: 0,
};

const initialMeta: ReviewMeta = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1,
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "---";

const getAvatarLabel = (review: AdminReview) =>
  (review.avatar && !review.avatar.startsWith("http") ? review.avatar : review.userName || "G")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const isAvatarImage = (avatar?: string | null) =>
  Boolean(avatar && /^(https?:\/\/|data:image\/|\/)/i.test(avatar));

const resolveMediaUrl = (url?: string | null) =>
  url && /^(data:|blob:)/i.test(url) ? url : getImageUrl(url);

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < Number(rating || 0) ? "fill-gold text-gold" : "text-slate-300"}`}
      />
    ))}
  </div>
);

const VisibilityBadge = ({ visible }: { visible: boolean }) =>
  visible ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
      <ShieldCheck className="h-3.5 w-3.5" />
      Đang hiển thị
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
      <EyeOff className="h-3.5 w-3.5" />
      Đã ẩn
    </span>
  );

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>(initialStats);
  const [meta, setMeta] = useState<ReviewMeta>(initialMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchReviews = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });

      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (ratingFilter !== "all") params.set("rating", ratingFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const data = await apiFetch(`/reviews/admin?${params.toString()}`);
      setReviews(Array.isArray(data.items) ? data.items : []);
      setStats(data.stats || initialStats);
      setMeta(data.meta || initialMeta);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchReviews, searchQuery ? 450 : 0);
    return () => window.clearTimeout(timer);
  }, [searchQuery, statusFilter, ratingFilter, dateFrom, dateTo, page]);

  const resetPage = (callback: () => void) => {
    setPage(1);
    callback();
  };

  const toggleVisibility = async (review: AdminReview) => {
    setActionId(review.id);

    try {
      await apiFetch(`/reviews/admin/${review.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible: !review.isVisible }),
      });
      toast.success(review.isVisible ? "Đã ẩn đánh giá khỏi trang khách" : "Đã hiển thị lại đánh giá");
      await fetchReviews();
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật đánh giá");
    } finally {
      setActionId(null);
    }
  };

  const deleteReview = async (review: AdminReview) => {
    const accepted = window.confirm("Bạn chắc chắn muốn xóa vĩnh viễn đánh giá này?");
    if (!accepted) return;

    setActionId(review.id);

    try {
      await apiFetch(`/reviews/admin/${review.id}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa đánh giá");
      await fetchReviews();
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa đánh giá");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gold">
            <MessageSquareText className="h-3.5 w-3.5" />
            Review Center
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Quản lý đánh giá</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Kiểm duyệt phản hồi khách hàng, theo dõi chất lượng khách sạn và xử lý các đánh giá cần chú ý.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-gold/40 hover:text-gold dark:border-border dark:bg-card dark:text-slate-200"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Tổng đánh giá</p>
          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Đang hiển thị</p>
          <p className="mt-3 text-3xl font-black text-emerald-700">{stats.visible}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Điểm trung bình</p>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-3xl font-black text-slate-950 dark:text-white">{stats.averageRating.toFixed(1)}</p>
            <RatingStars rating={Math.round(stats.averageRating)} />
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Cần chú ý</p>
          <div className="mt-3 flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
            <p className="text-3xl font-black text-amber-700">{stats.lowRating}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_160px_170px_170px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => resetPage(() => setSearchQuery(event.target.value))}
              placeholder="Tìm theo khách hàng, khách sạn hoặc nội dung đánh giá..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-border dark:bg-muted"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => resetPage(() => setStatusFilter(event.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-border dark:bg-muted"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(event) => resetPage(() => setRatingFilter(event.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-border dark:bg-muted"
          >
            <option value="all">Mọi số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => resetPage(() => setDateFrom(event.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-border dark:bg-muted"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => resetPage(() => setDateTo(event.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-border dark:bg-muted"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-border">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Filter className="h-4 w-4 text-gold" />
            {meta.total} đánh giá
          </div>
          <p className="text-xs text-slate-400">
            Trang {meta.page} / {meta.totalPages}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            Đang tải đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Chưa có đánh giá phù hợp bộ lọc.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-border">
            {reviews.map((review) => {
              const avatarImage = isAvatarImage(review.avatar) ? review.avatar || "" : "";
              const isBusy = actionId === review.id;

              return (
                <div key={review.id} className="grid gap-5 p-5 transition hover:bg-slate-50/70 dark:hover:bg-muted/30 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_180px]">
                  <div className="flex min-w-0 gap-4">
                    <img
                      src={resolveMediaUrl(review.hotelImage)}
                      alt=""
                      className="h-20 w-24 shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/admin/hotels/edit/${review.hotelId}`}
                        className="line-clamp-2 font-bold text-slate-950 transition hover:text-gold dark:text-white"
                      >
                        {review.hotelName}
                      </Link>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />
                        {review.hotelCity || "Chưa có thành phố"}
                      </p>
                      <div className="mt-3">
                        <VisibilityBadge visible={review.isVisible} />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/15 text-sm font-black text-gold">
                        {getAvatarLabel(review)}
                        {avatarImage && (
                          <img
                            src={avatarImage}
                            alt={review.userName}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white">{review.userName}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <UserRound className="h-3.5 w-3.5" />
                          {review.userEmail || "Khách đã đặt phòng"}
                        </p>
                      </div>
                      <RatingStars rating={review.rating} />
                      <span className="text-xs font-semibold text-slate-400">{formatDate(review.reviewDate)}</span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {review.comment}
                    </p>
                  </div>

                  <div className="flex items-center justify-start gap-2 xl:justify-end">
                    <Link
                      to={`/hotel/${review.hotelId}`}
                      target="_blank"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gold/50 hover:text-gold dark:border-border"
                      title="Xem trên website"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleVisibility(review)}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        review.isVisible
                          ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={review.isVisible ? "Ẩn đánh giá" : "Hiện đánh giá"}
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : review.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => deleteReview(review)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Xóa đánh giá"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-border">
          <p className="text-xs text-slate-400">
            Hiển thị {reviews.length} / {meta.total} đánh giá
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-gold/50 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 dark:border-border"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages || isLoading}
              onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-gold/50 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 dark:border-border"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;
