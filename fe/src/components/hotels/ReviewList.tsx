import { Star } from "lucide-react";
import { Review } from "@/data/hotels";
import { useLocale } from "@/contexts/LocaleContext";
import { getImageUrl } from "@/services/apiClient";

type ReviewWithMedia = Review & {
  images?: string[];
  videos?: string[];
  reviewDate?: string;
  createdAt?: string;
};

const formatReviewDate = (review: any, language: "vi" | "en") => {
  const value = review.date || review.reviewDate || review.createdAt;
  if (!value) return "";

  return new Date(value).toLocaleDateString(language === "en" ? "en-US" : "vi-VN");
};

const getReviewMediaSrc = (src: string) =>
  src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http")
    ? src
    : getImageUrl(src);

const isImageSource = (value?: string) => {
  if (!value) return false;
  const src = value.trim();
  return /^(https?:\/\/|data:image\/|blob:|\/)/i.test(src) || /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(src);
};

const getAvatarLabel = (review: any) => {
  const avatar = typeof review.avatar === "string" ? review.avatar.trim() : "";
  if (avatar && !isImageSource(avatar) && avatar.length <= 3) {
    return avatar.slice(0, 1).toUpperCase();
  }

  return String(review.userName || "G").trim().slice(0, 1).toUpperCase();
};

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

const ReviewList = ({ reviews = [] }: { reviews: ReviewWithMedia[] }) => {
  const { language } = useLocale();

  if (!reviews.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        {language === "en" ? "No reviews for this hotel yet." : "Chưa có đánh giá nào cho khách sạn này."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r: any) => {
        const avatarSrc = isImageSource(r.avatar) ? getReviewMediaSrc(String(r.avatar).trim()) : "";
        const reviewImages = getMediaItems(r.images, 3);
        const reviewVideos = getMediaItems(r.videos, 1);

        return (
          <div key={r.id} data-review-card className="rounded-2xl border border-border bg-card p-5 shadow-luxury">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/20 text-sm font-bold text-gold">
                <span>{getAvatarLabel(r)}</span>
                {avatarSrc && (
                  <img
                    src={avatarSrc}
                    alt={r.userName || ""}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.remove();
                    }}
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{r.userName}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Number(r.rating || 0) ? "fill-gold text-gold" : "text-slate-200"}`} />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground">{formatReviewDate(r, language)}</span>
                </div>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{r.comment}</p>
            {(reviewImages.length > 0 || reviewVideos.length > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {reviewImages.map((image: string, index: number) => (
                  <img
                    key={`${r.id}-image-${index}`}
                    src={getReviewMediaSrc(image)}
                    alt=""
                    className="aspect-square w-full rounded-xl object-cover ring-1 ring-slate-100"
                  />
                ))}
                {reviewVideos.map((video: string, index: number) => (
                  <video
                    key={`${r.id}-video-${index}`}
                    src={getReviewMediaSrc(video)}
                    controls
                    preload="metadata"
                    className="aspect-square w-full rounded-xl bg-slate-950 object-cover ring-1 ring-slate-100"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
