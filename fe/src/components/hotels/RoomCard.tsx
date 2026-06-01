import { useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize, Star, Users } from "lucide-react";

import { interpolate, useLocale } from "@/contexts/LocaleContext";
import { Room } from "@/data/hotels";
import { getImageUrl } from "@/services/apiClient";

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room) => void;
  onViewDetail?: (room: Room) => void;
}

const RoomCard = ({ room, onSelect, onViewDetail }: RoomCardProps) => {
  const { formatCurrency, t } = useLocale();
  const [imgIdx, setImgIdx] = useState(0);
  const imagesList =
    room.images && room.images.length > 0 ? room.images.map((img: any) => img.url || img) : [room.image];

  const nextImg = (event: MouseEvent) => {
    event.stopPropagation();
    setImgIdx((prev) => (prev + 1) % imagesList.length);
  };

  const prevImg = (event: MouseEvent) => {
    event.stopPropagation();
    setImgIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_20px_45px_-30px_rgba(15,23,42,0.25)] transition-all duration-300 hover:shadow-[0_30px_55px_-32px_rgba(15,23,42,0.3)] md:flex-row">
      <div
        className="group/img relative h-56 cursor-pointer overflow-hidden md:h-auto md:w-80 md:flex-shrink-0"
        onClick={() => onViewDetail?.(room)}
      >
        <img
          src={getImageUrl(imagesList[imgIdx])}
          alt={room.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-105"
          loading="lazy"
        />

        {imagesList.length > 1 && (
          <>
            <div className="absolute inset-0 bg-slate-950/10 opacity-0 transition-opacity group-hover/img:opacity-100" />
            <button
              onClick={prevImg}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 opacity-0 shadow-sm transition-all hover:bg-white group-hover/img:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 opacity-0 shadow-sm transition-all hover:bg-white group-hover/img:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {imagesList.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${index === imgIdx ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <button
            type="button"
            onClick={() => onViewDetail?.(room)}
            className="text-left font-heading text-2xl font-bold text-slate-900 transition-colors hover:text-gold"
          >
            {room.name}
          </button>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{room.description}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Users className="h-3.5 w-3.5" /> {interpolate(t("room.maxGuests"), { count: room.maxGuests })}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Maximize className="h-3.5 w-3.5" /> {room.size}m²
            </span>
            {room.quantityAvailable > 0 && room.quantityAvailable <= 3 && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                <Star className="h-3.5 w-3.5 fill-red-500" /> {interpolate(t("room.left"), { count: room.quantityAvailable })}
              </span>
            )}
            {room.quantityAvailable > 3 && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                {interpolate(t("room.available"), { count: room.quantityAvailable })}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("room.pricePerNight")}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gold">{formatCurrency(room.price)}</span>
              <span className="text-sm text-slate-400">{t("hotelCard.perNight")}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onViewDetail?.(room)}
              className="rounded-xl border border-gold px-4 py-3 text-sm font-semibold text-gold transition-colors hover:bg-amber-50"
            >
              {t("room.viewDetails")}
            </button>
            <button
              type="button"
              onClick={() => onSelect(room)}
              disabled={room.quantityAvailable <= 0}
              className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition-all ${
                room.quantityAvailable <= 0
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-gradient-gold text-primary hover:opacity-90"
              }`}
            >
              {room.quantityAvailable <= 0 ? t("room.soldOut") : t("room.select")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
