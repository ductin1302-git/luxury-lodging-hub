import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import ScrollReveal from "@/components/common/ScrollReveal";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import HotelCard from "@/components/hotels/HotelCard";
import { useFavoriteHotels } from "@/hooks/useFavoriteHotels";
import { useLocale } from "@/contexts/LocaleContext";
import { apiFetch } from "@/services/apiClient";

const FavoriteHotelsPage = () => {
  const { favoriteIds, clearFavorites } = useFavoriteHotels();
  const { language } = useLocale();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const copy =
    language === "en"
      ? {
          eyebrow: "Saved stays",
          title: "Favorite hotels",
          subtitle: "Keep your shortlisted hotels in one place and return to them when you are ready to book.",
          backProfile: "Back to profile",
          clear: "Clear list",
          search: "Search favorite hotels...",
          loading: "Loading your favorite hotels...",
          emptyTitle: "No favorite hotels yet",
          emptyDesc: "Tap the heart icon on any hotel to build a shortlist for your next trip.",
          explore: "Explore hotels",
          removedAll: "Favorite list cleared.",
          savedCount: "saved hotels",
        }
      : {
          eyebrow: "Lưu trú đã lưu",
          title: "Khách sạn yêu thích",
          subtitle: "Lưu các khách sạn bạn đang cân nhắc vào một nơi riêng để quay lại đặt phòng nhanh hơn.",
          backProfile: "Quay lại hồ sơ",
          clear: "Xóa danh sách",
          search: "Tìm trong khách sạn yêu thích...",
          loading: "Đang tải khách sạn yêu thích...",
          emptyTitle: "Chưa có khách sạn yêu thích",
          emptyDesc: "Bấm biểu tượng trái tim trên khách sạn để tạo danh sách cho chuyến đi tiếp theo.",
          explore: "Khám phá khách sạn",
          removedAll: "Đã xóa danh sách yêu thích.",
          savedCount: "khách sạn đã lưu",
        };

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      if (favoriteIds.length === 0) {
        setHotels([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await Promise.all(
          favoriteIds.map((id) => apiFetch(`/hotels/${id}`).catch(() => null)),
        );

        if (!cancelled) {
          setHotels(data.filter(Boolean));
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          toast.error(language === "en" ? "Could not load favorite hotels" : "Không thể tải khách sạn yêu thích");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFavorites();

    return () => {
      cancelled = true;
    };
  }, [favoriteIds, language]);

  const filteredHotels = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return hotels;

    return hotels.filter((hotel) =>
      [hotel.name, hotel.city, hotel.location, hotel.shortDescription]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [hotels, search]);

  const handleClearFavorites = () => {
    clearFavorites();
    toast.success(copy.removedAll);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-10 md:py-12">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.backProfile}
            </Link>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
                  <Heart className="h-4 w-4 fill-gold" />
                  {copy.eyebrow}
                </p>
                <h1 className="mt-3 font-heading text-3xl font-bold md:text-4xl">{copy.title}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{copy.subtitle}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-gold" />
                  {favoriteIds.length} {copy.savedCount}
                </div>
                {favoriteIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFavorites}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    {copy.clear}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-10">
          {favoriteIds.length > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.search}
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-muted-foreground">{copy.loading}</p>
            </div>
          ) : filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredHotels.map((hotel, index) => (
                <ScrollReveal key={hotel.id} delay={Math.min(index + 1, 4) as 1 | 2 | 3 | 4}>
                  <HotelCard hotel={hotel} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Heart className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-heading text-2xl font-bold">{copy.emptyTitle}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{copy.emptyDesc}</p>
              <Link
                to="/hotels"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary shadow-luxury transition hover:opacity-95"
              >
                {copy.explore}
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FavoriteHotelsPage;
