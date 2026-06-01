const FAVORITES_STORAGE_KEY = "luxstay_favorite_hotels_v1";
export const FAVORITES_CHANGED_EVENT = "luxstay-favorite-hotels-change";

type FavoriteStore = Record<string, string[]>;

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export const getFavoriteOwnerKey = (user?: { id?: string; email?: string } | null) =>
  user?.id || user?.email || "guest";

const readStore = (): FavoriteStore => {
  if (!canUseStorage()) return {};

  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: FavoriteStore) => {
  if (!canUseStorage()) return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
};

export const getFavoriteHotelIds = (ownerKey: string) => readStore()[ownerKey] || [];

export const setFavoriteHotelIds = (ownerKey: string, ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  writeStore({
    ...readStore(),
    [ownerKey]: uniqueIds,
  });
};

export const toggleFavoriteHotelId = (ownerKey: string, hotelId: string) => {
  const current = getFavoriteHotelIds(ownerKey);
  const isFavorite = current.includes(hotelId);
  const next = isFavorite ? current.filter((id) => id !== hotelId) : [hotelId, ...current];
  setFavoriteHotelIds(ownerKey, next);
  return !isFavorite;
};
