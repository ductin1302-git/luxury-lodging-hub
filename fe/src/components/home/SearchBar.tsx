import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Search, Users } from "lucide-react";

import { VIETNAM_PROVINCES } from "@/constants/vietnamProvinces";
import { useLocale } from "@/contexts/LocaleContext";

interface SearchBarProps {
  className?: string;
}

const SearchBar = ({ className = "" }: SearchBarProps) => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const today = new Date().toISOString().split("T")[0];
  const minCheckOut = checkIn
    ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split("T")[0]
    : today;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("city", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guests.toString());
    params.set("rooms", rooms.toString());
    navigate(`/hotels?${params.toString()}`);
  };

  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    if (checkOut && new Date(value) >= new Date(checkOut)) {
      const nextDay = new Date(new Date(value).getTime() + 86400000);
      setCheckOut(nextDay.toISOString().split("T")[0]);
    }
  };

  return (
    <div className={`bg-card rounded-xl shadow-luxury p-4 md:p-6 ${className}`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="md:col-span-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("search.destination")}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full appearance-none rounded-lg border-0 bg-muted py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">{t("search.chooseDestination")}</option>
              {VIETNAM_PROVINCES.map((region) => (
                <optgroup key={region.region} label={region.region}>
                  {region.provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("search.checkIn")}</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full rounded-lg border-0 bg-muted py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("search.checkOut")}</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <input
              type="date"
              value={checkOut}
              min={minCheckOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border-0 bg-muted py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("search.guests")}</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
              <select
                value={guests}
                onChange={(e) => setGuests(+e.target.value)}
                className="w-full rounded-lg border-0 bg-muted py-2.5 pl-9 pr-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("search.rooms")}</label>
            <select
              value={rooms}
              onChange={(e) => setRooms(+e.target.value)}
              className="w-full rounded-lg border-0 bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-gold py-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
          >
            <Search className="h-4 w-4" /> {t("search.submit")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
