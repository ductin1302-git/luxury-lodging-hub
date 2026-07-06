import { interpolate, useLocale } from "@/contexts/LocaleContext";

interface HotelFilters {
  priceRange: [number, number];
  stars: number[];
  amenities: string[];
}

interface FilterSidebarProps {
  filters: HotelFilters;
  onFilterChange: (filters: HotelFilters) => void;
  priceBounds: [number, number];
  className?: string;
  onReset?: () => void;
}

const allAmenities = [
  { value: "WiFi miễn phí", en: "Free WiFi" },
  { value: "Hồ bơi", en: "Swimming pool" },
  { value: "Spa & Wellness", en: "Spa & Wellness" },
  { value: "Nhà hàng", en: "Restaurant" },
  { value: "Phòng gym", en: "Fitness center" },
  { value: "Bãi đậu xe", en: "Parking" },
  { value: "Ăn sáng miễn phí", en: "Free breakfast" },
];

const FilterSidebar = ({ filters, onFilterChange, priceBounds, className = "", onReset }: FilterSidebarProps) => {
  const { formatCurrency, language, t } = useLocale();
  const [minPrice, maxPrice] = priceBounds;
  const currentMax = filters.priceRange[1] || maxPrice;

  const toggleStar = (star: number) => {
    const nextStars = filters.stars.includes(star)
      ? filters.stars.filter((item) => item !== star)
      : [...filters.stars, star];

    onFilterChange({ ...filters, stars: nextStars });
  };

  const toggleAmenity = (amenity: string) => {
    const nextAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((item) => item !== amenity)
      : [...filters.amenities, amenity];

    onFilterChange({ ...filters, amenities: nextAmenities });
  };

  const handlePriceMax = (value: number) => {
    onFilterChange({
      ...filters,
      priceRange: [minPrice, value],
    });
  };

  const resetFilters = () => {
    onFilterChange({
      priceRange: [minPrice, maxPrice],
      stars: [],
      amenities: [],
    });
    if (onReset) onReset();
  };

  return (
    <aside
      className={`rounded-[2rem] border border-white/10 bg-gradient-navy px-6 py-7 text-white shadow-[0_30px_60px_-35px_rgba(2,6,23,0.75)] ${className}`}
    >
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h3 className="font-heading text-2xl font-bold text-white">{t("hotels.filter")}</h3>
          <p className="mt-2 max-w-[220px] text-sm leading-6 text-white/68">{t("hotels.filteredBy")}</p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.24em] text-gold transition-colors hover:text-gold-light"
        >
          {t("hotels.reset")}
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-white">{t("hotels.price")}</h4>
            <span className="text-xs font-medium text-white/70">
              {currentMax >= maxPrice ? t("hotels.allPrices") : interpolate(t("hotels.upTo"), { price: formatCurrency(currentMax) })}
            </span>
          </div>
          <input
            type="range"
            min={minPrice || 0}
            max={maxPrice || 0}
            step={100000}
            value={currentMax}
            onChange={(event) => handlePriceMax(Number(event.target.value))}
            disabled={maxPrice <= 0}
            className="w-full accent-gold"
          />
          <div className="mt-4 flex items-center justify-between text-sm font-medium text-white/70">
            <span>{formatCurrency(minPrice || 0)}</span>
            <span>{formatCurrency(maxPrice || 0)}</span>
          </div>
        </section>

        <section className="border-t border-white/10 pt-8">
          <h4 className="mb-4 text-base font-semibold text-white">{t("hotels.stars")}</h4>
          <div className="flex flex-wrap gap-2.5">
            {[3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => toggleStar(star)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  filters.stars.includes(star)
                    ? "bg-gold text-primary"
                    : "border border-white/10 bg-white/6 text-white/78 hover:bg-white/10"
                }`}
              >
                {interpolate(t("hotels.star"), { count: star })}
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 pt-8">
          <h4 className="mb-4 text-base font-semibold text-white">{t("hotels.amenities")}</h4>
          <div className="space-y-3.5">
            {allAmenities.map((amenity) => (
              <label key={amenity.value} className="flex cursor-pointer items-center gap-3 text-sm text-white/78">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity.value)}
                  onChange={() => toggleAmenity(amenity.value)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent accent-gold"
                />
                <span>{language === "en" ? amenity.en : amenity.value}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default FilterSidebar;
