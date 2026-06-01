import { Link, useLocation } from "react-router-dom";
import { Star, MapPin, Waves, Wifi, Utensils, Sparkles, Heart } from "lucide-react";
import { Hotel } from "@/data/hotels";
import { getImageUrl } from "@/services/apiClient";
import { interpolate, useLocale } from "@/contexts/LocaleContext";
import { useFavoriteHotels } from "@/hooks/useFavoriteHotels";

const HotelCard = ({ hotel }: { hotel: Hotel }) => {
  const location = useLocation();
  const { formatCurrency, t } = useLocale();
  const { isFavorite, toggleFavorite } = useFavoriteHotels();
  const detailUrl = `/hotel/${hotel.id}${location.search}`;
  const displayPrice = Number(hotel.lowestAvailablePrice || hotel.pricePerNight);
  const favorite = isFavorite(hotel.id);

  return (
    <Link to={detailUrl} className="group block h-full">
      <div className="bg-white dark:bg-card h-full rounded-[2.5rem] overflow-hidden shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative flex flex-col">
        
        {/* Save/Like Button */}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(hotel.id, hotel.name);
          }}
          className={`absolute top-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-500 active:scale-90 group-hover:translate-y-0 group-hover:opacity-100 ${
            favorite
              ? "translate-y-0 border-red-200 bg-white text-red-500 opacity-100 shadow-lg"
              : "translate-y-0 border-white/30 bg-slate-950/25 text-white opacity-100 hover:bg-white hover:text-red-500"
          }`}
          aria-label={favorite ? "Bỏ yêu thích" : "Lưu khách sạn yêu thích"}
        >
           <Heart className={`w-5 h-5 ${favorite ? "fill-current" : ""}`} />
        </button>

        {/* Image Section */}
        <div className="relative h-48 xl:h-52 overflow-hidden">
          <img 
            src={getImageUrl(hotel.images[0])} 
            alt={hotel.name} 
            className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
            loading="lazy" 
          />
          
          {/* High-end Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {hotel.promoted && (
              <div className="bg-gold text-slate-950 text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-[0.2em] flex items-center gap-1 backdrop-blur-md">
                <Sparkles className="w-2.5 h-2.5" /> {t("hotelCard.deal")}
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-xl text-white border border-white/20 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">
               {hotel.location?.split(',')[0] || hotel.city}
            </div>
            {hotel.availableRoomCount !== undefined && (
              <div className="bg-emerald-500/90 backdrop-blur-xl text-white border border-white/20 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                {interpolate(t("hotelCard.roomTypes"), { count: hotel.availableRoomCount })}
              </div>
            )}
          </div>

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gold px-2 py-0.5 rounded-md">
                <Star className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                <span className="text-[10px] font-black text-slate-950">{Number(hotel.rating).toFixed(1)}</span>
              </div>
              <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest">
                {interpolate(t("hotelCard.reviews"), { count: hotel.reviewCount })}
              </span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-5 xl:p-6 flex-1 flex flex-col">
          {/* Stars */}
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`w-2.5 h-2.5 ${i < hotel.stars ? "text-gold fill-gold" : "text-slate-200 dark:text-slate-800"}`} 
              />
            ))}
          </div>

          <h3 className="font-heading text-lg xl:text-xl font-black text-slate-900 dark:text-white mb-1.5 leading-none line-clamp-1 group-hover:text-gold transition-colors duration-500 italic">
            {hotel.name}
          </h3>

          <p className="flex items-center gap-2 text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mb-4">
            <MapPin className="w-3 h-3 text-gold" /> 
            {hotel.location?.split(',')[0]}
          </p>

          {/* Amenities Summary */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-gold transition-colors">
              <Waves className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">{t("hotelCard.pool")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-gold transition-colors">
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">{t("hotelCard.wifi")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-gold transition-colors">
              <Utensils className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">{t("hotelCard.dining")}</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">{t("hotelCard.from")}</span>
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="text-lg xl:text-xl font-black text-slate-950 dark:text-white tracking-tighter">
                  {formatCurrency(displayPrice)}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  {t("hotelCard.perNight")}
                </span>
              </div>
            </div>
            
            <div className="w-9 h-9 rounded-xl bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 group-hover:bg-gold group-hover:text-slate-950 transition-all duration-500 shadow-xl group-hover:shadow-gold/20">
               <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;
