import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import ScrollReveal from "@/components/common/ScrollReveal";
import LocationMap from "@/components/hotels/LocationMap";
import ReviewList from "@/components/hotels/ReviewList";
import RoomCard from "@/components/hotels/RoomCard";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useBooking } from "@/contexts/BookingContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Room } from "@/data/hotels";
import { useFavoriteHotels } from "@/hooks/useFavoriteHotels";
import { apiFetch, getImageUrl } from "@/services/apiClient";

const getImageValue = (image: any) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || image.imageUrl || image.src || image.path || "";
};

const uniqueImages = (images: any[]) => {
  const seen = new Set<string>();
  return images
    .map(getImageValue)
    .map((image) => image.trim())
    .filter((image) => {
      if (!image || seen.has(image)) return false;
      seen.add(image);
      return true;
    });
};

const getMediaValue = (item: unknown) => {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object" && "url" in item) return String((item as { url?: unknown }).url || "").trim();
  return "";
};

const getMediaItems = (value: unknown, limit: number) =>
  Array.isArray(value)
    ? value
        .map(getMediaValue)
        .filter(Boolean)
        .slice(0, limit)
    : [];

const getText = (value: any) => String(value || "").trim();

const buildHotelAddress = (hotel: any) => {
  const parts = [
    hotel?.addressLine,
    hotel?.location,
    hotel?.ward,
    hotel?.district,
    hotel?.city,
  ]
    .map(getText)
    .filter(Boolean);

  return Array.from(new Set(parts)).join(", ");
};

const normalizeAmenity = (amenity: any) => amenity?.name || amenity?.title || amenity;

const normalizePolicy = (policy: any) => ({
  id: policy?.id || `${policy?.policyType || "policy"}-${policy?.title || policy?.content}`,
  title: policy?.title || policy?.policyType || "Policy",
  content: policy?.content || "",
});

const HotelDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentBooking } = useBooking();
  const { formatCurrency, language, t } = useLocale();
  const { isFavorite, toggleFavorite } = useFavoriteHotels();
  const [hotel, setHotel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  const pageCopy = useMemo(
    () =>
      language === "en"
        ? {
            loadError: "Could not load hotel details",
            loading: "Loading hotel details...",
            notFound: "Hotel not found",
          }
        : {
            loadError: "Không thể tải thông tin khách sạn",
            loading: "Đang tải thông tin khách sạn...",
            notFound: "Không tìm thấy khách sạn",
          },
    [language],
  );

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            breadcrumbsHotels: "Hotels",
            premiumStay: "Premium stay",
            gallery: "Gallery",
            photos: "photos",
            overview: "Overview",
            highlights: "Stay highlights",
            amenities: "Featured amenities",
            rooms: "Available room types",
            roomHint: "Review room photos, capacity, amenities and book the room that fits your stay.",
            noRooms: "This hotel has not published any rooms yet.",
            reviews: "Guest reviews",
            reviewHint: "Showing every verified review from completed bookings.",
            viewAllReviews: "Open review page",
            guestRating: "Guest rating",
            reviewCount: "reviews",
            priceFrom: "From",
            viewRooms: "View rooms",
            location: "Location and directions",
            contact: "Contact hotel",
            policies: "Hotel policies",
            noPolicies: "The hotel has not published detailed policies yet.",
            checkIn: "Check-in",
            checkOut: "Check-out",
            roomTypes: "Room types",
            guests: "Guests",
            saveFavorite: "Save favorite",
            savedFavorite: "Saved",
            mapSubtitle: "Open directions in Google Maps for the fastest route.",
            perNight: "per night",
            availableNow: "Available for booking",
          }
        : {
            breadcrumbsHotels: "Khách sạn",
            premiumStay: "Kỳ nghỉ cao cấp",
            gallery: "Thư viện ảnh",
            photos: "ảnh",
            overview: "Tổng quan",
            highlights: "Điểm nổi bật",
            amenities: "Tiện nghi nổi bật",
            rooms: "Các loại phòng đang bán",
            roomHint: "Xem ảnh phòng, sức chứa, tiện nghi và chọn loại phòng phù hợp nhất.",
            noRooms: "Khách sạn chưa có phòng nào được đăng.",
            reviews: "Đánh giá khách hàng",
            reviewHint: "Hiển thị toàn bộ đánh giá thật từ các booking đã hoàn tất.",
            viewAllReviews: "Mở trang đánh giá",
            guestRating: "Đánh giá khách lưu trú",
            reviewCount: "nhận xét",
            priceFrom: "Từ",
            viewRooms: "Xem phòng",
            location: "Vị trí và chỉ đường",
            contact: "Liên hệ khách sạn",
            policies: "Chính sách khách sạn",
            noPolicies: "Khách sạn chưa cập nhật chính sách chi tiết.",
            checkIn: "Nhận phòng",
            checkOut: "Trả phòng",
            roomTypes: "Loại phòng",
            guests: "Khách",
            saveFavorite: "Lưu yêu thích",
            savedFavorite: "Đã yêu thích",
            mapSubtitle: "Mở chỉ đường trên Google Maps để xem tuyến đường nhanh nhất.",
            perNight: "mỗi đêm",
            availableNow: "Đang mở bán",
          },
    [language],
  );

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const queryString = searchParams.toString();
        const data = await apiFetch(`/hotels/${id}${queryString ? `?${queryString}` : ""}`);
        setHotel(data);
      } catch (error) {
        console.error(error);
        toast.error(pageCopy.loadError);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchHotel();
    }
  }, [id, pageCopy.loadError, searchParams]);

  const imagesList = useMemo(() => uniqueImages(Array.isArray(hotel?.images) ? hotel.images : []), [hotel?.images]);
  const displayReviews = useMemo(() => {
    if (!hotel) return [];
    return (Array.isArray(hotel.reviews) ? hotel.reviews : []).map((review: any) => ({
      ...review,
      userName: review.userName || review.user?.fullName || review.user?.name || review.user?.email || "Guest",
      avatar: review.user?.avatar || review.avatar,
      images: getMediaItems(review.images, 3),
      videos: getMediaItems(review.videos, 1),
      reviewDate: review.reviewDate || review.createdAt || review.date,
    }));
  }, [hotel]);
  const hotelAddress = useMemo(() => (hotel ? buildHotelAddress(hotel) : ""), [hotel]);
  const amenities = useMemo(
    () => (Array.isArray(hotel?.amenities) ? hotel.amenities.map(normalizeAmenity).filter(Boolean) : []),
    [hotel?.amenities],
  );
  const rooms = useMemo(() => (Array.isArray(hotel?.rooms) ? hotel.rooms : []), [hotel?.rooms]);
  const policies = useMemo(
    () => (Array.isArray(hotel?.policies) ? hotel.policies.map(normalizePolicy).filter((policy) => policy.content || policy.title) : []),
    [hotel?.policies],
  );

  useEffect(() => {
    setImgIdx(0);
  }, [hotel?.id, imagesList.length]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="text-slate-500">{pageCopy.loading}</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-xl text-slate-500">{pageCopy.notFound}</p>
      </div>
    );
  }

  const primaryImage = imagesList[imgIdx] || imagesList[0];
  const hotelRating = Number(hotel.rating || 0);
  const hotelPrice = Number(hotel.pricePerNight || 0);
  const favorite = isFavorite(hotel.id);
  const visibleReviewCount = displayReviews.length;
  const maxGuests = rooms.reduce((total: number, room: any) => total + Number(room.maxGuests || 0), 0);
  const starCount = Math.max(0, Math.min(5, Math.round(Number(hotel.stars || 0))));

  const handleSelectRoom = (room: Room) => {
    const guests = Number(searchParams.get("guests") || 2);
    const selectedRooms = Number(searchParams.get("rooms") || 1);
    const checkIn = searchParams.get("checkIn") || "";
    const checkOut = searchParams.get("checkOut") || "";

    setCurrentBooking({
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomId: room.id,
      roomName: room.name,
      roomPrice: Number(room.price),
      checkIn,
      checkOut,
      guests,
      rooms: selectedRooms,
    });
    navigate("/booking");
  };

  const handleViewRoomDetail = (room: Room) => {
    navigate(`/hotel/${hotel.id}/rooms/${room.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <Header />

      <main className="pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Header Section */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Link to="/hotels" className="transition hover:text-gold">
                  {copy.breadcrumbsHotels}
                </Link>
                <span>/</span>
                <span className="text-slate-900">{hotel.name}</span>
              </nav>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  {hotel.name}
                </h1>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: starCount }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <MapPin className="h-4 w-4 text-gold shrink-0" />
                <span>{hotelAddress || hotel.location || hotel.city}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleFavorite(hotel.id, hotel.name)}
                className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                  favorite
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-500"
                }`}
              >
                <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                {favorite ? copy.savedFavorite : copy.saveFavorite}
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-xl bg-gradient-gold px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary shadow-lg shadow-gold/20 hover:opacity-95 transition active:scale-95"
              >
                {copy.viewRooms}
              </button>
            </div>
          </div>

          {/* Professional Gallery Section */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-luxury mb-6">
            <div className="grid gap-1 lg:grid-cols-[2fr_1fr] h-[300px] md:h-[400px] lg:h-[460px]">
              {/* Main Image */}
              <div className="relative overflow-hidden bg-slate-200 h-full w-full">
                {primaryImage ? (
                  <img
                    key={primaryImage}
                    src={getImageUrl(primaryImage)}
                    alt={hotel.name}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}

                {imagesList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setImgIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length)}
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-lg transition"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImgIdx((prev) => (prev + 1) % imagesList.length)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-lg transition"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                
                {/* Badge */}
                <div className="absolute top-3 left-3">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/60 border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md">
                    <BadgeCheck className="h-3 w-3 text-gold" />
                    {copy.premiumStay}
                  </div>
                </div>

                {/* Image counter */}
                {imagesList.length > 1 && (
                  <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    <ImageIcon className="mr-1 inline h-3 w-3" />
                    {imgIdx + 1} / {imagesList.length}
                  </div>
                )}
              </div>

              {/* Side Images 2x2 Grid */}
              <div className="hidden lg:grid grid-rows-2 grid-cols-2 gap-1 h-full w-full">
                {imagesList.slice(1, 5).map((image, index) => (
                  <button
                    key={`side-${image}-${index}`}
                    type="button"
                    onClick={() => setImgIdx(index + 1)}
                    className="group relative overflow-hidden bg-slate-200"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-slate-950/0 transition group-hover:bg-slate-950/10" />
                    {index === 3 && imagesList.length > 5 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm font-bold text-white backdrop-blur-[2px]">
                        +{imagesList.length - 5} {copy.photos}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Thumbnail Strip */}
            {imagesList.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 border-t border-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {imagesList.map((image, index) => (
                  <button
                    key={`thumb-${image}-${index}`}
                    type="button"
                    onClick={() => setImgIdx(index)}
                    className={`h-11 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      index === imgIdx ? "border-gold shadow-sm" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={getImageUrl(image)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Quick Stats Bar */}
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Star, label: copy.guestRating, value: `${hotelRating.toFixed(1)}/5`, sub: `${visibleReviewCount} ${copy.reviewCount}` },
              { icon: BedDouble, label: copy.roomTypes, value: `${rooms.length}`, sub: copy.availableNow },
              { icon: Users, label: copy.guests, value: `${maxGuests || "-"}`, sub: language === "en" ? "total capacity" : "sức chứa tối đa" },
              { icon: MapPin, label: copy.location, value: hotel.city || hotel.district || "-", sub: hotel.district || hotel.location },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Icon className="h-4.5 w-4.5 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <p className="truncate text-base font-bold text-slate-900">{stat.value}</p>
                    <p className="truncate text-[11px] text-slate-500">{stat.sub}</p>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8">

              <ScrollReveal direction="up">
                <section className="border-b border-slate-200 pb-8">
                  <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
                    <div className="border-l-3 border-gold pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.overview}</p>
                      <h2 className="mt-2 font-heading text-2xl font-bold text-slate-950">{hotel.name}</h2>
                    </div>
                    <p className="text-[15px] leading-7 text-slate-600">{hotel.description || hotel.shortDescription}</p>
                  </div>
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={1}>
                <section className="border-b border-slate-200 pb-8">
                  <div className="mb-4 border-l-3 border-gold pl-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.highlights}</p>
                    <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.amenities}</h2>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-600 shadow-sm transition hover:border-gold/30 hover:shadow-md">
                        <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up">
                <section id="rooms" className="border-b border-slate-200 pb-8">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div className="border-l-3 border-gold pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.rooms}</p>
                      <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">
                        {copy.rooms} ({rooms.length})
                      </h2>
                      <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">{copy.roomHint}</p>
                    </div>
                  </div>

                  {rooms.length > 0 ? (
                    <div className="space-y-5">
                      {rooms.map((room: any, index: number) => (
                        <ScrollReveal key={room.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
                          <RoomCard
                            room={{
                              ...room,
                              amenities: Array.isArray(room.amenities) ? room.amenities.map(normalizeAmenity).filter(Boolean) : [],
                            }}
                            onSelect={handleSelectRoom}
                            onViewDetail={handleViewRoomDetail}
                          />
                        </ScrollReveal>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
                      {copy.noRooms}
                    </div>
                  )}
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={1}>
                <section className="border-b border-slate-200 pb-8">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div className="border-l-3 border-gold pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.reviews}</p>
                      <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">
                        {copy.reviews} ({visibleReviewCount})
                      </h2>
                      <p className="mt-1.5 text-[13px] text-slate-500">{copy.reviewHint}</p>
                    </div>
                    <Link
                      to={`/hotel/${hotel.id}/reviews`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-gold/50 hover:text-gold"
                    >
                      {copy.viewAllReviews}
                    </Link>
                  </div>
                  <ReviewList reviews={displayReviews} />
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up">
                <section className="border-b border-slate-200 pb-8">
                  <div className="mb-4 border-l-3 border-gold pl-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.location}</p>
                    <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.location}</h2>
                  </div>
                  <LocationMap title={copy.location} subtitle={copy.mapSubtitle} address={hotelAddress} language={language} />
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={1}>
                <section className="pb-6">
                  <div className="mb-4 border-l-3 border-gold pl-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.policies}</p>
                    <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.policies}</h2>
                  </div>

                  {policies.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {policies.map((policy) => (
                        <div key={policy.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                          <ShieldCheck className="h-4.5 w-4.5 text-gold" />
                          <h3 className="mt-2.5 font-heading text-base font-bold text-slate-950">{policy.title}</h3>
                          <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{policy.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                      {copy.noPolicies}
                    </div>
                  )}
                </section>
              </ScrollReveal>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Gold gradient accent bar */}
                <div className="h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold text-lg font-bold text-primary">{hotelRating.toFixed(1)}</div>
                    <div>
                      <p className="font-bold text-slate-950">{copy.guestRating}</p>
                      <p className="text-xs text-slate-500">{visibleReviewCount} {copy.reviewCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{copy.priceFrom}</p>
                    <p className="mt-1.5 text-3xl font-bold text-gold">{formatCurrency(hotelPrice)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{copy.perNight}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" })}
                    className="mt-4 w-full rounded-xl bg-gradient-gold py-3.5 text-sm font-bold text-primary shadow-lg shadow-gold/20 transition hover:opacity-95 hover:shadow-xl hover:shadow-gold/25 active:scale-[0.98]"
                  >
                    {copy.viewRooms}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFavorite(hotel.id, hotel.name)}
                    className={`mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      favorite
                        ? "border-red-200 bg-red-50 text-red-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                    {favorite ? copy.savedFavorite : copy.saveFavorite}
                  </button>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="p-5">
                  <h3 className="font-heading text-base font-bold text-slate-950">{copy.contact}</h3>
                  <div className="mt-3 space-y-2">
                    {hotel.contactPhone && (
                      <a href={`tel:${hotel.contactPhone}`} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:text-gold hover:bg-gold/5">
                        <Phone className="h-3.5 w-3.5 text-gold" />
                        {hotel.contactPhone}
                      </a>
                    )}
                    {hotel.contactEmail && (
                      <a href={`mailto:${hotel.contactEmail}`} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:text-gold hover:bg-gold/5">
                        <Mail className="h-3.5 w-3.5 text-gold" />
                        {hotel.contactEmail}
                      </a>
                    )}
                    <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-gold" />
                      <span>{copy.checkIn}: {hotel.checkInTime || "14:00"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-600">
                      <CalendarDays className="h-3.5 w-3.5 text-gold" />
                      <span>{copy.checkOut}: {hotel.checkOutTime || "12:00"}</span>
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HotelDetail;
