import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
  FAVORITES_CHANGED_EVENT,
  getFavoriteHotelIds,
  getFavoriteOwnerKey,
  setFavoriteHotelIds,
  toggleFavoriteHotelId,
} from "@/services/favoritesService";

export const useFavoriteHotels = () => {
  const { user } = useAuth();
  const { language } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const ownerKey = useMemo(() => getFavoriteOwnerKey(user), [user]);
  const [favoriteIds, setFavoriteIdsState] = useState<string[]>(() => getFavoriteHotelIds(ownerKey));

  const refresh = useCallback(() => {
    setFavoriteIdsState(getFavoriteHotelIds(ownerKey));
  }, [ownerKey]);

  useEffect(() => {
    refresh();

    const handleChange = () => refresh();
    window.addEventListener("storage", handleChange);
    window.addEventListener(FAVORITES_CHANGED_EVENT, handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, handleChange);
    };
  }, [refresh]);

  const requireLogin = useCallback(() => {
    if (user) return true;

    toast.info(language === "en" ? "Please sign in to save favorite hotels." : "Vui lòng đăng nhập để lưu khách sạn yêu thích.");
    const returnTo = `${location.pathname}${location.search}`;
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
    return false;
  }, [language, location.pathname, location.search, navigate, user]);

  const isFavorite = useCallback(
    (hotelId: string) => favoriteIds.includes(hotelId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    (hotelId: string, hotelName?: string) => {
      if (!hotelId || !requireLogin()) return false;

      const isNowFavorite = toggleFavoriteHotelId(ownerKey, hotelId);
      const fallbackName = language === "en" ? "hotel" : "khách sạn";

      toast.success(
        isNowFavorite
          ? language === "en"
            ? `Saved ${hotelName || fallbackName} to favorites.`
            : `Đã lưu ${hotelName || fallbackName} vào yêu thích.`
          : language === "en"
            ? `Removed ${hotelName || fallbackName} from favorites.`
            : `Đã bỏ ${hotelName || fallbackName} khỏi yêu thích.`,
      );

      return isNowFavorite;
    },
    [language, ownerKey, requireLogin],
  );

  const clearFavorites = useCallback(() => {
    setFavoriteHotelIds(ownerKey, []);
  }, [ownerKey]);

  return {
    favoriteIds,
    clearFavorites,
    isFavorite,
    toggleFavorite,
  };
};
