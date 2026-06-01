import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, MessageSquareText, Search, Star } from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLocale } from "@/contexts/LocaleContext";
import { apiFetch, getImageUrl } from "@/services/apiClient";

type ReviewItem = {
  id: string;
  userName: string;
  avatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  videos?: string[];
  date?: string;
  reviewDate?: string;
  createdAt?: string;
};

const getReviewDate = (review: ReviewItem) => review.date || review.reviewDate || review.createdAt || "";

const getReviewMediaSrc = (src: string) =>
  src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http") ? src : getImageUrl(src);

const getMediaValue = (item: unknown) => {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object" && "url" in item) return String(item.url || "").trim();
  return "";
};

const getMediaItems = (value: unknown, limit: number) =>
  Array.isArray(value)
    ? value
        .map(getMediaValue)
        .filter(Boolean)
        .slice(0, limit)
    : [];

const isImageSource = (value?: string) => {
  if (!value) return false;
  const src = value.trim();
  return /^(https?:\/\/|data:image\/|blob:|\/)/i.test(src) || /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(src);
};

const getAvatarLabel = (review: ReviewItem) => {
  const avatar = String(review.avatar || "").trim();
  if (avatar && !isImageSource(avatar) && avatar.length <= 3) return avatar.slice(0, 1).toUpperCase();
  return String(review.userName || "G").trim().slice(0, 1).toUpperCase();
};

const RatingStars = ({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`${size} ${index < Number(rating || 0) ? "fill-gold text-gold" : "text-slate-300"}`}
      />
    ))}
  </div>
);

const HotelReviewsPage = () => {
  const { id } = useParams();
  const { language } = useLocale();
  const [hotel, setHotel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [mediaOnly, setMediaOnly] = useState(false);
  const [search, setSearch] = useState("");

  const copy =
    language === "en"
      ? {
          loading: "Loading reviews...",
          loadError: "Could not load reviews",
          back: "Back to hotel",
          title: "All guest reviews",
          subtitle: "Browse star ratings, real photos and detailed stay experiences from verified bookings.",
          all: "All",
          withMedia: "With photos/videos",
          search: "Search review content...",
          noReviews: "No reviews match your filters.",
          reviews: "reviews",
          avg: "Average rating",
        }
      : {
          loading: "Đang tải đánh giá...",
          loadError: "Không thể tải đánh giá",
          back: "Quay lại khách sạn",
          title: "Tất cả đánh giá",
          subtitle: "Xem điểm sao, hình ảnh thực tế và trải nghiệm chi tiết từ các booking đã hoàn tất.",
          all: "Tất cả",
          withMedia: "Có ảnh/video",
          search: "Tìm nội dung đánh giá...",
          noReviews: "Không có đánh giá phù hợp bộ lọc.",
          reviews: "đánh giá",
          avg: "Điểm trung bình",
        };

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const data = await apiFetch(`/hotels/${id}`);
        setHotel(data);
      } catch (error) {
        console.error(error);
        toast.error(copy.loadError);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchHotel();
  }, [copy.loadError, id]);

  const displayReviews = useMemo<ReviewItem[]>(() => {
    if (!hotel) return [];

    const serverReviews = Array.isArray(hotel.reviews) ? hotel.reviews : [];
    return serverReviews.map((review: any) => ({
      ...review,
      userName: review.userName || review.user?.fullName || review.user?.name || review.user?.email || "Guest",
      avatar: review.user?.avatar || review.avatar,
      images: getMediaItems(review.images, 3),
      videos: getMediaItems(review.videos, 1),
      reviewDate: review.reviewDate || review.createdAt || review.date,
    }));
  }, [hotel]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return displayReviews.filter((review) => {
      const images = getMediaItems(review.images, 3);
      const videos = getMediaItems(review.videos, 1);
      const matchesRating = ratingFilter === "all" || Number(review.rating || 0) === Number(ratingFilter);
      const matchesMedia = !mediaOnly || images.length > 0 || videos.length > 0;
      const matchesSearch =
        !normalizedSearch ||
        String(review.comment || "").toLowerCase().includes(normalizedSearch) ||
        String(review.userName || "").toLowerCase().includes(normalizedSearch);

      return matchesRating && matchesMedia && matchesSearch;
    });
  }, [displayReviews, mediaOnly, ratingFilter, search]);

  const stats = useMemo(() => {
    const total = displayReviews.length;
    const average = total
      ? displayReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
      : 0;
    const withMedia = displayReviews.filter(
      (review) => (review.images?.length || 0) > 0 || (review.videos?.length || 0) > 0,
    ).length;

    return {
      total,
      average,
      withMedia,
    };
  }, [displayReviews]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" />
          {copy.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Header />

      <main className="pt-24">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              to={hotel?.id ? `/hotel/${hotel.id}` : "/hotels"}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Link>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold">{hotel?.name || "Luxury Stay"}</p>
                <h1 className="mt-3 font-heading text-4xl font-bold text-slate-950 md:text-5xl">{copy.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{copy.subtitle}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-gold px-5 py-4 text-3xl font-black text-primary">
                    {stats.average.toFixed(1)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{copy.avg}</p>
                    <RatingStars rating={Math.round(stats.average)} size="h-5 w-5" />
                    <p className="mt-1 text-xs text-slate-500">{stats.total} {copy.reviews}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {["all", "5", "4", "3", "2", "1"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRatingFilter(value)}
                    className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                      ratingFilter === value
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-slate-200 text-slate-600 hover:border-gold/40 hover:text-gold"
                    }`}
                  >
                    {value === "all" ? copy.all : `${value} sao`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMediaOnly((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    mediaOnly
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-slate-200 text-slate-600 hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  {copy.withMedia} ({stats.withMedia})
                </button>
              </div>

              <div className="relative w-full xl:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.search}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">{copy.noReviews}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const avatarSrc = isImageSource(review.avatar) ? getReviewMediaSrc(String(review.avatar).trim()) : "";
                const reviewImages = getMediaItems(review.images, 3);
                const reviewVideos = getMediaItems(review.videos, 1);

                return (
                  <article key={review.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/15 text-sm font-black text-gold">
                        <span>{getAvatarLabel(review)}</span>
                        {avatarSrc && <img src={avatarSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">{review.userName}</p>
                          <RatingStars rating={review.rating} />
                          <span className="text-xs font-semibold text-slate-400">
                            {getReviewDate(review) ? new Date(getReviewDate(review)).toLocaleDateString(language === "en" ? "en-US" : "vi-VN") : ""}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>

                        {(reviewImages.length > 0 || reviewVideos.length > 0) && (
                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {reviewImages.map((image, index) => (
                              <img
                                key={`${review.id}-image-${index}`}
                                src={getReviewMediaSrc(image)}
                                alt=""
                                className="aspect-square w-full rounded-xl object-cover"
                              />
                            ))}
                            {reviewVideos.map((video, index) => (
                              <video
                                key={`${review.id}-video-${index}`}
                                src={getReviewMediaSrc(video)}
                                controls
                                preload="metadata"
                                className="aspect-square w-full rounded-xl bg-slate-950 object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HotelReviewsPage;
