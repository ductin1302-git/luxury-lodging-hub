import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";

import ScrollReveal from "@/components/common/ScrollReveal";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PromotionsHero from "@/components/home/PromotionsHero";
import { useLocale } from "@/contexts/LocaleContext";
import { apiFetch, getImageUrl } from "@/services/apiClient";

interface Promotion {
  id: string;
  code: string;
  title: string;
  description?: string;
  imageUrl?: string;
  discountType: "percent" | "amount";
  discountValue: number;
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount?: number;
  createdAt?: string;
  isActive: boolean;
}

type PromotionFilter = "all" | "active" | "upcoming" | "ending";
type SortMode = "recommended" | "discount" | "ending";

const fallbackImage =
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=90&w=1400";

const dayMs = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseDate = (value?: string) => (value ? new Date(value) : null);

const formatDate = (value: string | undefined, language: "vi" | "en") => {
  if (!value) return language === "en" ? "No end date" : "Không giới hạn";
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const getPromotionTiming = (promotion: Promotion) => {
  const today = startOfToday();
  const startDate = parseDate(promotion.startDate);
  const endDate = parseDate(promotion.endDate);
  const isUpcoming = Boolean(startDate && startDate > today);
  const isExpired = Boolean(endDate && endDate < today);
  const daysUntilStart = isUpcoming && startDate ? Math.ceil((startDate.getTime() - today.getTime()) / dayMs) : 0;
  const daysLeft = !isExpired && endDate ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / dayMs)) : null;

  return {
    isUpcoming,
    isExpired,
    isLive: promotion.isActive && !isUpcoming && !isExpired,
    isEndingSoon: promotion.isActive && !isUpcoming && !isExpired && daysLeft !== null && daysLeft <= 7,
    daysUntilStart,
    daysLeft,
  };
};

const PromotionsPage = () => {
  const { formatCurrency, language } = useLocale();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<PromotionFilter>("active");
  const [sortBy, setSortBy] = useState<SortMode>("recommended");
  const [searchTerm, setSearchTerm] = useState("");

  const copy =
    language === "en"
      ? {
          headline: "Current Voucher Collection",
          subline: "Browse verified offers, see conditions clearly, and copy codes in one tap.",
          active: "Available now",
          all: "All offers",
          upcoming: "Upcoming",
          ending: "Ending soon",
          recommended: "Recommended",
          discount: "Biggest discount",
          endingSort: "Closest end date",
          search: "Search by code or deal name...",
          loading: "Loading offers...",
          empty: "No matching offers are available.",
          live: "Live",
          soon: "Upcoming",
          endingSoon: "Ending soon",
          expired: "Closed",
          code: "Voucher code",
          copy: "Copy code",
          copied: "Voucher code copied.",
          minOrder: "Minimum order",
          noMin: "No minimum order",
          validUntil: "Valid until",
          startsAfter: "Starts in {count} days",
          daysLeft: "{count} days left",
          useNow: "Book with this offer",
          conditions: "Usage conditions",
          limited: "{used}/{limit} used",
          unlimited: "Unlimited usage",
          statsActive: "Live deals",
          statsEnding: "Ending within 7 days",
          statsBest: "Best value",
          howTitle: "A smoother voucher flow",
          steps: [
            { title: "Choose a suitable offer", desc: "Check dates, minimum order and remaining usage before booking." },
            { title: "Copy the voucher code", desc: "Paste it at checkout and the system will calculate the eligible discount." },
            { title: "Complete your booking", desc: "Your room, payment and promotion details stay together in booking history." },
          ],
          memberTitle: "Member-only deal alerts",
          memberDesc: "Sign in to keep booking history, favorites and private deal recommendations in one place.",
          memberCta: "Go to account",
        }
      : {
          headline: "Bộ sưu tập voucher hiện hành",
          subline: "Xem ưu đãi rõ điều kiện, trạng thái minh bạch và sao chép mã chỉ với một thao tác.",
          active: "Đang dùng được",
          all: "Tất cả ưu đãi",
          upcoming: "Sắp diễn ra",
          ending: "Sắp hết hạn",
          recommended: "Gợi ý tốt nhất",
          discount: "Giảm nhiều nhất",
          endingSort: "Gần hết hạn",
          search: "Tìm theo mã hoặc tên ưu đãi...",
          loading: "Đang tải ưu đãi...",
          empty: "Chưa có ưu đãi phù hợp.",
          live: "Đang mở",
          soon: "Sắp mở",
          endingSoon: "Sắp hết hạn",
          expired: "Đã đóng",
          code: "Mã voucher",
          copy: "Sao chép mã",
          copied: "Đã sao chép mã voucher.",
          minOrder: "Đơn tối thiểu",
          noMin: "Không yêu cầu đơn tối thiểu",
          validUntil: "Có hiệu lực đến",
          startsAfter: "Bắt đầu sau {count} ngày",
          daysLeft: "Còn {count} ngày",
          useNow: "Đặt phòng với ưu đãi",
          conditions: "Điều kiện áp dụng",
          limited: "Đã dùng {used}/{limit}",
          unlimited: "Không giới hạn lượt dùng",
          statsActive: "Ưu đãi đang mở",
          statsEnding: "Hết hạn trong 7 ngày",
          statsBest: "Mức giảm tốt nhất",
          howTitle: "Quy trình dùng voucher mượt hơn",
          steps: [
            { title: "Chọn ưu đãi phù hợp", desc: "Kiểm tra ngày áp dụng, đơn tối thiểu và số lượt còn lại trước khi đặt." },
            { title: "Sao chép mã voucher", desc: "Dán mã ở bước thanh toán để hệ thống tự tính mức giảm hợp lệ." },
            { title: "Hoàn tất booking", desc: "Thông tin phòng, thanh toán và ưu đãi được lưu cùng lịch sử đặt phòng." },
          ],
          memberTitle: "Nhận ưu đãi riêng cho thành viên",
          memberDesc: "Đăng nhập để gom lịch booking, khách sạn yêu thích và gợi ý ưu đãi cá nhân trong một nơi.",
          memberCta: "Vào tài khoản",
        };

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetch("/promotions");
        setPromotions(Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
      } catch (error) {
        console.error("Failed to fetch promotions", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const visiblePromotions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return promotions
      .filter((promotion) => {
        const timing = getPromotionTiming(promotion);
        const matchesSearch =
          !keyword ||
          promotion.code.toLowerCase().includes(keyword) ||
          promotion.title.toLowerCase().includes(keyword) ||
          promotion.description?.toLowerCase().includes(keyword);

        if (!matchesSearch) return false;
        if (filter === "active") return timing.isLive;
        if (filter === "upcoming") return promotion.isActive && timing.isUpcoming;
        if (filter === "ending") return timing.isEndingSoon;
        return promotion.isActive && !timing.isExpired;
      })
      .sort((a, b) => {
        if (sortBy === "discount") return Number(b.discountValue || 0) - Number(a.discountValue || 0);
        if (sortBy === "ending") {
          const aDate = a.endDate ? new Date(a.endDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bDate = b.endDate ? new Date(b.endDate).getTime() : Number.MAX_SAFE_INTEGER;
          return aDate - bDate;
        }

        const aTiming = getPromotionTiming(a);
        const bTiming = getPromotionTiming(b);
        if (aTiming.isEndingSoon !== bTiming.isEndingSoon) return aTiming.isEndingSoon ? -1 : 1;
        if (aTiming.isLive !== bTiming.isLive) return aTiming.isLive ? -1 : 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [filter, promotions, searchTerm, sortBy]);

  const livePromotions = promotions.filter((promotion) => getPromotionTiming(promotion).isLive);
  const endingSoonCount = promotions.filter((promotion) => getPromotionTiming(promotion).isEndingSoon).length;
  const bestPromotion = livePromotions.reduce<Promotion | null>(
    (best, promotion) => (!best || Number(promotion.discountValue || 0) > Number(best.discountValue || 0) ? promotion : best),
    null,
  );
  const featuredPromotion = visiblePromotions[0];

  const getDiscountLabel = (promotion?: Promotion | null) => {
    if (!promotion) return "0";
    return promotion.discountType === "percent"
      ? `${Number(promotion.discountValue || 0)}%`
      : formatCurrency(Number(promotion.discountValue || 0));
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(copy.copied);
    } catch {
      toast.success(code);
    }
  };

  const renderStatus = (promotion: Promotion) => {
    const timing = getPromotionTiming(promotion);
    if (timing.isUpcoming) return { label: copy.soon, className: "bg-sky-50 text-sky-700 border-sky-100" };
    if (timing.isEndingSoon) return { label: copy.endingSoon, className: "bg-amber-50 text-amber-700 border-amber-100" };
    if (!timing.isLive) return { label: copy.expired, className: "bg-slate-100 text-slate-500 border-slate-200" };
    return { label: copy.live, className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  };

  const PromotionCard = ({ promotion, featured = false }: { promotion: Promotion; featured?: boolean }) => {
    const timing = getPromotionTiming(promotion);
    const status = renderStatus(promotion);
    const canUse = timing.isLive;

    return (
      <article
        className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_80px_-48px_rgba(15,23,42,0.6)] ${
          featured ? "lg:grid lg:grid-cols-[0.98fr_1.02fr]" : "flex h-full flex-col"
        }`}
      >
        <div className={`relative overflow-hidden ${featured ? "min-h-[330px]" : "h-56"}`}>
          <img
            src={getImageUrl(promotion.imageUrl) || fallbackImage}
            alt={promotion.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
          <span className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}>
            {status.label}
          </span>
          <div className="absolute bottom-5 left-5 rounded-xl bg-white/92 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{copy.statsBest}</p>
            <p className="mt-1 text-3xl font-black text-primary">{getDiscountLabel(promotion)}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gold">
              <TicketPercent className="h-4 w-4" />
              {promotion.discountType === "percent" ? "Percent voucher" : "Cash voucher"}
            </div>
            <h2 className={`${featured ? "text-3xl" : "text-2xl"} font-heading font-bold leading-tight text-slate-950`}>
              {promotion.title}
            </h2>
            {promotion.description && (
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500">{promotion.description}</p>
            )}

            <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{copy.minOrder}</p>
                <p className="mt-1 font-bold text-slate-900">
                  {Number(promotion.minOrderAmount || 0) > 0
                    ? formatCurrency(Number(promotion.minOrderAmount))
                    : copy.noMin}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{copy.validUntil}</p>
                <p className="mt-1 font-bold text-slate-900">{formatDate(promotion.endDate, language)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                {promotion.usageLimit
                  ? copy.limited
                      .replace("{used}", String(promotion.usedCount || 0))
                      .replace("{limit}", String(promotion.usageLimit))
                  : copy.unlimited}
              </span>
              {timing.isUpcoming && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  {copy.startsAfter.replace("{count}", String(timing.daysUntilStart))}
                </span>
              )}
              {timing.daysLeft !== null && !timing.isUpcoming && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {copy.daysLeft.replace("{count}", String(timing.daysLeft))}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{copy.code}</p>
              <button
                type="button"
                onClick={() => copyCode(promotion.code)}
                className="mt-1 inline-flex items-center gap-2 rounded-xl border border-dashed border-gold/50 bg-amber-50 px-4 py-2 font-mono text-lg font-black text-primary transition-colors hover:bg-gold/20"
              >
                {promotion.code}
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/hotels"
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                canUse
                  ? "bg-primary text-white shadow-lg shadow-primary/10 hover:bg-gold hover:text-primary"
                  : "pointer-events-none bg-slate-100 text-slate-400"
              }`}
            >
              {copy.useNow}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <PromotionsHero />

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            { label: copy.statsActive, value: livePromotions.length, icon: BadgePercent, color: "text-emerald-600" },
            { label: copy.statsEnding, value: endingSoonCount, icon: Clock3, color: "text-amber-600" },
            { label: copy.statsBest, value: getDiscountLabel(bestPromotion), icon: Sparkles, color: "text-gold" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">{copy.conditions}</p>
                <h1 className="mt-3 font-heading text-4xl font-bold text-slate-950">{copy.headline}</h1>
                <p className="mt-3 text-sm leading-7 text-slate-500">{copy.subline}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-[260px]">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={copy.search}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/10"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortMode)}
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-gold focus:ring-4 focus:ring-gold/10"
                >
                  <option value="recommended">{copy.recommended}</option>
                  <option value="discount">{copy.discount}</option>
                  <option value="ending">{copy.endingSort}</option>
                </select>
              </div>
            </div>
          </ScrollReveal>

          <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
            {[
              { value: "active", label: copy.active },
              { value: "ending", label: copy.ending },
              { value: "upcoming", label: copy.upcoming },
              { value: "all", label: copy.all },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value as PromotionFilter)}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${
                  filter === item.value
                    ? "border-primary bg-primary text-white shadow-lg shadow-primary/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-gold hover:text-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-gold" />
              <p className="text-sm font-bold text-slate-500">{copy.loading}</p>
            </div>
          ) : visiblePromotions.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <Tag className="mb-4 h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-500">{copy.empty}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {featuredPromotion && (
                <ScrollReveal direction="up">
                  <PromotionCard promotion={featuredPromotion} featured />
                </ScrollReveal>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visiblePromotions.slice(1).map((promotion, index) => (
                  <ScrollReveal key={promotion.id} delay={((index % 3) + 1) as 1 | 2 | 3} direction="up">
                    <PromotionCard promotion={promotion} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <ScrollReveal direction="left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">{copy.howTitle}</p>
              <h2 className="mt-4 font-heading text-4xl font-bold leading-tight text-slate-950">
                {copy.memberTitle}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">{copy.memberDesc}</p>
              <Link
                to="/profile"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-gold hover:text-primary"
              >
                {copy.memberCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <ScrollReveal key={step.title} delay={(index + 1) as 1 | 2 | 3} direction="up">
                <div className="h-full rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gold shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">0{index + 1}</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PromotionsPage;
