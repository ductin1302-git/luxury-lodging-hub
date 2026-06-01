import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, SlidersHorizontal, Users, X } from "lucide-react";
import { toast } from "sonner";

import FilterSidebar from "@/components/hotels/FilterSidebar";
import HotelCard from "@/components/hotels/HotelCard";
import ScrollReveal from "@/components/common/ScrollReveal";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import HotelsHero from "@/components/home/HotelsHero";
import { interpolate, useLocale } from "@/contexts/LocaleContext";
import { apiFetch } from "@/services/apiClient";

interface HotelFilters {
  priceRange: [number, number];
  stars: number[];
  amenities: string[];
}

const sortToApi: Record<string, string> = {
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  rating: "rating_desc",
};

const HotelListing = () => {
  const { language, t } = useLocale();
  const [searchParams] = useSearchParams();
  const cityFilter = searchParams.get("city") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = Number(searchParams.get("guests") || 2);
  const rooms = Number(searchParams.get("rooms") || 1);
  const [sortBy, setSortBy] = useState("popular");
  const [filters, setFilters] = useState<HotelFilters>({
    priceRange: [0, 0],
    stars: [],
    amenities: [],
  });
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHotels = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (cityFilter) params.set("city", cityFilter);
        if (checkIn) params.set("checkIn", checkIn);
        if (checkOut) params.set("checkOut", checkOut);
        params.set("guests", String(guests));
        params.set("rooms", String(rooms));
        if (sortToApi[sortBy]) params.set("sort", sortToApi[sortBy]);

        const data = await apiFetch(`/hotels?${params.toString()}`);
        setHotels(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error(error);
        toast.error(language === "en" ? "Could not load hotel list" : "Không thể tải danh sách khách sạn");
      } finally {
        setIsLoading(false);
      }
    };

    loadHotels();
  }, [checkIn, checkOut, cityFilter, guests, language, rooms, sortBy]);

  const priceBounds = useMemo<[number, number]>(() => {
    const prices = hotels
      .map((hotel) => Number(hotel.lowestAvailablePrice || hotel.pricePerNight) || 0)
      .filter((price) => price > 0);

    if (prices.length === 0) return [0, 0];
    return [Math.min(...prices), Math.max(...prices)];
  }, [hotels]);

  useEffect(() => {
    if (!priceBounds[1]) return;

    setFilters((prev) => {
      if (prev.priceRange[1] > 0) return prev;
      return { ...prev, priceRange: [priceBounds[0], priceBounds[1]] };
    });
  }, [priceBounds]);

  const filteredHotels = useMemo(() => {
    let result = [...hotels];

    if (filters.stars.length > 0) {
      result = result.filter((hotel) => filters.stars.includes(Number(hotel.stars)));
    }

    if (filters.priceRange[1] > 0) {
      result = result.filter((hotel) => {
        const price = Number(hotel.lowestAvailablePrice || hotel.pricePerNight) || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    if (filters.amenities.length > 0) {
      result = result.filter((hotel) =>
        filters.amenities.every((amenity) =>
          hotel.amenities?.some((item: any) => (item.name || item) === amenity),
        ),
      );
    }

    return result;
  }, [filters, hotels]);

  const staySummary = [
    cityFilter || t("hotels.allDestinations"),
    checkIn && checkOut ? `${checkIn} - ${checkOut}` : t("hotels.pickDates"),
    interpolate(t("hotels.guestCount"), { count: guests }),
    interpolate(t("hotels.roomCount"), { count: rooms }),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HotelsHero />

      <div className="page-enter mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4 animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 md:text-3xl">
              {cityFilter ? interpolate(t("hotels.inCity"), { city: cityFilter }) : t("hotels.all")}
              <span className="ml-2 text-lg font-normal text-slate-400">({filteredHotels.length})</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("hotels.filteredBy")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              {staySummary.map((item, index) => (
                <span key={`${item}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  {index === 1 ? <CalendarDays className="h-3.5 w-3.5 text-gold" /> : index > 1 ? <Users className="h-3.5 w-3.5 text-gold" /> : null}
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileFilter((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> {t("hotels.filter")}
            </button>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-gold/20"
            >
              <option value="popular">{t("hotels.sort.popular")}</option>
              <option value="price-asc">{t("hotels.sort.priceAsc")}</option>
              <option value="price-desc">{t("hotels.sort.priceDesc")}</option>
              <option value="rating">{t("hotels.sort.rating")}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="hidden w-80 flex-shrink-0 self-start lg:block">
            <div className="sticky top-28 animate-fade-in-left" style={{ animationDelay: "0.3s", opacity: 0 }}>
              <FilterSidebar filters={filters} onFilterChange={setFilters} priceBounds={priceBounds} />
            </div>
          </div>

          {showMobileFilter && (
            <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden animate-fade-in" onClick={() => setShowMobileFilter(false)}>
              <div
                className="absolute left-0 top-0 bottom-0 w-full max-w-sm overflow-auto bg-white p-4 animate-fade-in-left"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold text-slate-900">{t("hotels.filter")}</h3>
                  <button onClick={() => setShowMobileFilter(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <FilterSidebar filters={filters} onFilterChange={setFilters} priceBounds={priceBounds} />
              </div>
            </div>
          )}

          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
                <p className="text-slate-500">{t("hotels.loading")}</p>
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="animate-fade-in-up py-20 text-center">
                <p className="mb-2 text-xl text-slate-500">{t("hotels.emptyTitle")}</p>
                <p className="text-sm text-slate-400">{t("hotels.emptyHint")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredHotels.map((hotel, index) => (
                  <ScrollReveal key={hotel.id} delay={((index % 3) + 1) as 1 | 2 | 3} direction="up">
                    <HotelCard
                      hotel={{
                        ...hotel,
                        images: hotel.images?.map((image: any) => image.url || image) || [],
                        amenities: hotel.amenities?.map((amenity: any) => amenity.name || amenity) || [],
                      }}
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HotelListing;
