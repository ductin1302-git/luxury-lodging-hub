import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Hotel,
  Image as ImageIcon,
  MapPin,
  Maximize,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import ScrollReveal from "@/components/common/ScrollReveal";
import LocationMap from "@/components/hotels/LocationMap";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useBooking } from "@/contexts/BookingContext";
import { interpolate, useLocale } from "@/contexts/LocaleContext";
import { Room } from "@/data/hotels";
import { apiFetch, getImageUrl } from "@/services/apiClient";

type RoomDetailData = Room & {
  availableUnits?: number;
  originalPrice?: number;
  salePrice?: number | null;
  maxAdults?: number;
  maxChildren?: number;
  bedType?: string | null;
  bedCount?: number;
  bathroomCount?: number;
  roomView?: string | null;
  hasBalcony?: boolean;
  hasBathtub?: boolean;
};

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

const getText = (value: any) => String(value || "").trim();

const buildHotelAddress = (hotel: any) => {
  const parts = [hotel?.addressLine, hotel?.location, hotel?.ward, hotel?.district, hotel?.city]
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

const RoomDetailPage = () => {
  const { id, roomId } = useParams();
  const navigate = useNavigate();
  const { setCurrentBooking } = useBooking();
  const { formatCurrency, language, t } = useLocale();
  const [hotel, setHotel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            loadError: "Could not load room details",
            loading: "Loading room details...",
            notFound: "Room not found",
            backList: "Back to hotel",
            hotels: "Hotels",
            room: "Room",
            premiumRoom: "Premium room",
            gallery: "Room gallery",
            photos: "photos",
            overview: "Room overview",
            overviewHint: "A complete room profile with photos, capacity, bedding, amenities and hotel location.",
            roomSpecs: "Room details",
            amenities: "In-room amenities",
            stayInfo: "Stay information",
            policies: "Hotel policies",
            noPolicies: "The hotel has not published detailed policies yet.",
            location: "Hotel location",
            mapSubtitle: "Open directions in Google Maps for the fastest route to this hotel.",
            capacity: "Capacity",
            adults: "adults",
            children: "children",
            area: "Area",
            view: "View",
            bed: "Bed",
            bathroom: "Bathroom",
            balcony: "Balcony",
            bathtub: "Bathtub",
            included: "Included",
            notIncluded: "Not included",
            available: "Available rooms",
            soldOutText: "This room is currently sold out.",
            perNight: "per night",
            bookTitle: "Reserve this room",
            bookNow: "Book this room",
            soldOut: "Sold out",
            hotel: "Hotel",
            contactHint: "Final taxes, voucher discount and payment details are shown clearly at checkout.",
            checkIn: "Check-in",
            checkOut: "Check-out",
            from: "From",
            originalPrice: "Original price",
            selectedRoom: "Selected room",
            backHotel: "Back to hotel detail",
          }
        : {
            loadError: "Không thể tải thông tin phòng",
            loading: "Đang tải chi tiết phòng...",
            notFound: "Không tìm thấy phòng",
            backList: "Quay lại khách sạn",
            hotels: "Khách sạn",
            room: "Phòng",
            premiumRoom: "Hạng phòng cao cấp",
            gallery: "Thư viện ảnh phòng",
            photos: "ảnh",
            overview: "Tổng quan phòng",
            overviewHint: "Hồ sơ phòng đầy đủ với ảnh, sức chứa, giường ngủ, tiện nghi và vị trí khách sạn.",
            roomSpecs: "Chi tiết phòng",
            amenities: "Tiện nghi trong phòng",
            stayInfo: "Thông tin lưu trú",
            policies: "Chính sách khách sạn",
            noPolicies: "Khách sạn chưa cập nhật chính sách chi tiết.",
            location: "Vị trí khách sạn",
            mapSubtitle: "Mở chỉ đường trên Google Maps để xem tuyến đường nhanh nhất tới khách sạn.",
            capacity: "Sức chứa",
            adults: "người lớn",
            children: "trẻ em",
            area: "Diện tích",
            view: "Hướng nhìn",
            bed: "Giường",
            bathroom: "Phòng tắm",
            balcony: "Ban công",
            bathtub: "Bồn tắm",
            included: "Có",
            notIncluded: "Không",
            available: "Phòng còn trống",
            soldOutText: "Hiện tại hạng phòng này đã hết chỗ.",
            perNight: "mỗi đêm",
            bookTitle: "Đặt hạng phòng này",
            bookNow: "Đặt phòng ngay",
            soldOut: "Hết phòng",
            hotel: "Khách sạn",
            contactHint: "Thuế phí, mã giảm giá và chi tiết thanh toán sẽ được hiển thị rõ ở bước thanh toán.",
            checkIn: "Nhận phòng",
            checkOut: "Trả phòng",
            from: "Từ",
            originalPrice: "Giá gốc",
            selectedRoom: "Hạng phòng đã chọn",
            backHotel: "Quay lại chi tiết khách sạn",
          },
    [language],
  );

  useEffect(() => {
    const loadHotel = async () => {
      try {
        const data = await apiFetch(`/hotels/${id}`);
        setHotel(data);
      } catch (error) {
        console.error(error);
        toast.error(copy.loadError);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadHotel();
    }
  }, [id, copy.loadError]);

  const room = useMemo(() => {
    if (!hotel?.rooms?.length) return null;
    return hotel.rooms.find((item: any) => item.id === roomId) || null;
  }, [hotel, roomId]);

  const normalizedRoom = useMemo<RoomDetailData | null>(() => {
    if (!room) return null;

    const roomImages = uniqueImages([
      room.image,
      ...(Array.isArray(room.images) ? room.images : []),
      ...(Array.isArray(hotel?.images) ? hotel.images : []),
    ]);
    const originalPrice = Number(room.price || 0);
    const salePrice = room.salePrice ? Number(room.salePrice) : null;
    const activePrice = Number(salePrice || originalPrice || 0);

    return {
      ...room,
      image: room.image || roomImages[0] || "",
      images: roomImages,
      price: activePrice,
      originalPrice,
      salePrice,
      maxGuests: Number(room.maxGuests || 0),
      maxAdults: Number(room.maxAdults || room.maxGuests || 0),
      maxChildren: Number(room.maxChildren || 0),
      size: Number(room.size || 0),
      bedCount: Number(room.bedCount || 1),
      bathroomCount: Number(room.bathroomCount || 1),
      bedType: room.bedType || null,
      roomView: room.roomView || null,
      hasBalcony: Boolean(room.hasBalcony),
      hasBathtub: Boolean(room.hasBathtub),
      amenities: Array.isArray(room.amenities) ? room.amenities.map(normalizeAmenity).filter(Boolean) : [],
      quantityAvailable: Number(room.quantityAvailable ?? room.availableUnits ?? 0),
      availableUnits: Number(room.availableUnits ?? room.quantityAvailable ?? 0),
    };
  }, [hotel?.images, room]);

  const imagesList = useMemo(
    () => (normalizedRoom?.images?.length ? normalizedRoom.images : normalizedRoom?.image ? [normalizedRoom.image] : []),
    [normalizedRoom?.image, normalizedRoom?.images],
  );
  const hotelAddress = useMemo(() => (hotel ? buildHotelAddress(hotel) : ""), [hotel]);
  const policies = useMemo(
    () => (Array.isArray(hotel?.policies) ? hotel.policies.map(normalizePolicy).filter((policy) => policy.content || policy.title) : []),
    [hotel?.policies],
  );
  const starCount = useMemo(() => Math.max(0, Math.min(5, Math.round(Number(hotel?.stars || 0)))), [hotel?.stars]);

  useEffect(() => {
    setImgIdx(0);
  }, [roomId, imagesList.length]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="text-slate-500">{copy.loading}</p>
        </div>
      </div>
    );
  }

  if (!hotel || !normalizedRoom) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 pt-28 text-center sm:px-6 lg:px-8">
          <div>
            <p className="text-2xl font-semibold text-slate-900">{copy.notFound}</p>
            <Link
              to={id ? `/hotel/${id}` : "/hotels"}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-gold/50 hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" /> {copy.backList}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const primaryImage = imagesList[imgIdx] || "";
  const isSoldOut = normalizedRoom.quantityAvailable <= 0;
  const hasDiscount = Boolean(normalizedRoom.salePrice && normalizedRoom.originalPrice && normalizedRoom.salePrice < normalizedRoom.originalPrice);

  const handleBooking = () => {
    setCurrentBooking({
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomId: normalizedRoom.id,
      roomName: normalizedRoom.name,
      roomPrice: normalizedRoom.price,
    });
    navigate("/booking");
  };

  const specItems = [
    {
      icon: Users,
      label: copy.capacity,
      value: interpolate(t("room.maxGuests"), { count: normalizedRoom.maxGuests }),
      hint: `${normalizedRoom.maxAdults || normalizedRoom.maxGuests} ${copy.adults}${
        normalizedRoom.maxChildren ? `, ${normalizedRoom.maxChildren} ${copy.children}` : ""
      }`,
    },
    {
      icon: Maximize,
      label: copy.area,
      value: `${normalizedRoom.size || "-"}m²`,
      hint: copy.selectedRoom,
    },
    {
      icon: BedDouble,
      label: copy.bed,
      value: normalizedRoom.bedType || (language === "en" ? "Standard bed" : "Giường tiêu chuẩn"),
      hint: `${normalizedRoom.bedCount || 1} ${language === "en" ? "bed(s)" : "giường"}`,
    },
    {
      icon: Bath,
      label: copy.bathroom,
      value: `${normalizedRoom.bathroomCount || 1}`,
      hint: normalizedRoom.hasBathtub ? copy.bathtub : copy.bathroom,
    },
    {
      icon: DoorOpen,
      label: copy.view,
      value: normalizedRoom.roomView || hotel.location || hotel.city || "-",
      hint: normalizedRoom.hasBalcony ? copy.balcony : copy.notIncluded,
    },
    {
      icon: Sparkles,
      label: copy.available,
      value: isSoldOut ? copy.soldOut : `${normalizedRoom.quantityAvailable}`,
      hint: isSoldOut ? copy.soldOutText : t("room.available").replace("{count}", String(normalizedRoom.quantityAvailable)),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <Header />

      <main className="pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Header Section */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Link to="/hotels" className="transition hover:text-gold">
                  {copy.hotels}
                </Link>
                <span>/</span>
                <Link to={`/hotel/${hotel.id}`} className="transition hover:text-gold">
                  {hotel.name}
                </Link>
                <span>/</span>
                <span className="text-slate-900">{normalizedRoom.name}</span>
              </nav>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  {normalizedRoom.name}
                </h1>
                <div className="inline-flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {copy.premiumRoom}
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Hotel className="h-4 w-4 text-gold shrink-0" />
                <span className="font-bold">{hotel.name}</span>
                <span className="text-slate-300">•</span>
                <MapPin className="h-4 w-4 text-gold shrink-0" />
                <span>{hotelAddress || hotel.location || hotel.city}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/hotel/${hotel.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 transition shadow-sm hover:border-gold/50 hover:text-gold"
              >
                <ArrowLeft className="h-4 w-4" /> {copy.backHotel}
              </Link>
              <button
                onClick={handleBooking}
                disabled={isSoldOut}
                className={`rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider transition shadow-lg ${
                  isSoldOut
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-gradient-gold text-primary shadow-gold/20 hover:opacity-95 active:scale-95"
                }`}
              >
                {isSoldOut ? copy.soldOut : copy.bookNow}
              </button>
            </div>
          </div>

          {/* Professional Gallery + Info Section */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-luxury mb-6">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              {/* Image Gallery */}
              <div className="relative overflow-hidden bg-slate-200 aspect-[4/3] max-h-[440px]">
                {primaryImage ? (
                  <img
                    key={primaryImage}
                    src={getImageUrl(primaryImage)}
                    alt={normalizedRoom.name}
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

                {/* Image counter */}
                {imagesList.length > 1 && (
                  <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    <ImageIcon className="mr-1 inline h-3 w-3" />
                    {imgIdx + 1} / {imagesList.length}
                  </div>
                )}

                {/* Thumbnail strip inside image area */}
                {imagesList.length > 1 && (
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {imagesList.slice(0, 6).map((image, index) => (
                      <button
                        key={`thumb-${image}-${index}`}
                        type="button"
                        onClick={() => setImgIdx(index)}
                        className={`h-10 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          index === imgIdx ? "border-gold shadow-sm" : "border-white/50 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={getImageUrl(image)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="flex flex-col justify-between p-6 lg:p-7">
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: starCount }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{copy.hotel}</p>
                  <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{hotel.name}</h2>
                  <p className="mt-3 line-clamp-4 text-[13px] leading-6 text-slate-600">
                    {normalizedRoom.description || hotel.description || copy.overviewHint}
                  </p>
                </div>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{copy.from}</p>
                    <p className="mt-1.5 text-xl font-bold text-gold">{formatCurrency(normalizedRoom.price)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{copy.perNight}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{copy.available}</p>
                    <p className={`mt-1.5 text-xl font-bold ${isSoldOut ? "text-red-500" : normalizedRoom.quantityAvailable <= 3 ? "text-amber-600" : "text-slate-950"}`}>{isSoldOut ? 0 : normalizedRoom.quantityAvailable}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{isSoldOut ? copy.soldOutText : t("room.available").replace("{count}", String(normalizedRoom.quantityAvailable))}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8">
              <ScrollReveal direction="up">
                <section className="border-b border-slate-200 pb-8">
                  <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
                    <div className="border-l-3 border-gold pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.overview}</p>
                      <h2 className="mt-2 font-heading text-2xl font-bold text-slate-950">{normalizedRoom.name}</h2>
                    </div>
                    <p className="text-[15px] leading-7 text-slate-600">
                      {normalizedRoom.description || hotel.description || copy.overviewHint}
                    </p>
                  </div>
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={1}>
                <section className="border-b border-slate-200 pb-8">
                  <div className="mb-4 border-l-3 border-gold pl-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.roomSpecs}</p>
                    <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.roomSpecs}</h2>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {specItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-gold/30 hover:shadow-md">
                          <Icon className="h-4.5 w-4.5 text-gold" />
                          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                          <p className="mt-1 text-base font-bold text-slate-950">{item.value}</p>
                          <p className="mt-0.5 text-[12px] leading-5 text-slate-500">{item.hint}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </ScrollReveal>

              {imagesList.length > 1 && (
                <ScrollReveal direction="up" delay={2}>
                  <section className="border-b border-slate-200 pb-8">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                      <div className="border-l-3 border-gold pl-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.gallery}</p>
                        <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.gallery}</h2>
                      </div>
                      <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                        {imagesList.length} {copy.photos}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {imagesList.slice(0, 8).map((image, index) => (
                        <button
                          key={`gallery-${image}-${index}`}
                          type="button"
                          onClick={() => setImgIdx(index)}
                          className={`group relative aspect-[3/2] overflow-hidden rounded-xl border transition ${index === imgIdx ? "border-gold shadow-md" : "border-slate-200 hover:border-gold/40"}`}
                        >
                          <img src={getImageUrl(image)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          {index === 7 && imagesList.length > 8 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm font-bold text-white backdrop-blur-[2px]">
                              +{imagesList.length - 8}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>
              )}

              <ScrollReveal direction="up">
                <section className="border-b border-slate-200 pb-8">
                  <div className="mb-4 border-l-3 border-gold pl-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.amenities}</p>
                    <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.amenities}</h2>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {normalizedRoom.amenities.length > 0 ? (
                      normalizedRoom.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-600 shadow-sm transition hover:border-gold/30 hover:shadow-md">
                          <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
                          <span>{amenity}</span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        {language === "en" ? "No room amenities have been published yet." : "Hạng phòng chưa cập nhật tiện nghi chi tiết."}
                      </div>
                    )}
                  </div>
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={1}>
                <section className="border-b border-slate-200 pb-8">
                  <div className="mb-4 border-l-3 border-gold pl-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.location}</p>
                    <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.location}</h2>
                  </div>
                  <LocationMap title={copy.location} subtitle={copy.mapSubtitle} address={hotelAddress} language={language} />
                </section>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={2}>
                <section className="pb-6">
                  <div className="mb-4 border-l-3 border-gold pl-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.policies}</p>
                    <h2 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{copy.stayInfo}</h2>
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
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{copy.bookTitle}</p>
                  <h3 className="mt-1.5 font-heading text-xl font-bold text-slate-950">{normalizedRoom.name}</h3>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{copy.from}</p>
                    <p className="mt-1.5 text-3xl font-bold text-gold">{formatCurrency(normalizedRoom.price)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{copy.perNight}</p>
                    {hasDiscount && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        {copy.originalPrice}: <span className="line-through">{formatCurrency(normalizedRoom.originalPrice || 0)}</span>
                      </p>
                    )}
                  </div>

                  {/* Urgency indicator */}
                  {!isSoldOut && normalizedRoom.quantityAvailable <= 3 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <p className="text-[12px] font-semibold text-amber-700">
                        {language === "en" ? `Only ${normalizedRoom.quantityAvailable} room(s) left!` : `Chỉ còn ${normalizedRoom.quantityAvailable} phòng!`}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2.5 rounded-xl bg-slate-50 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Hotel className="mt-0.5 h-3.5 w-3.5 text-gold" />
                      <div>
                        <p className="text-[13px] font-bold text-slate-950">{hotel.name}</p>
                        <p className="mt-0.5 text-[12px] text-slate-500">{hotel.city || hotel.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Users className="mt-0.5 h-3.5 w-3.5 text-gold" />
                      <div>
                        <p className="text-[13px] font-bold text-slate-950">{interpolate(t("room.maxGuests"), { count: normalizedRoom.maxGuests })}</p>
                        <p className="mt-0.5 text-[12px] text-slate-500">{normalizedRoom.size || "-"}m²</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CalendarDays className="mt-0.5 h-3.5 w-3.5 text-gold" />
                      <div>
                        <p className="text-[13px] font-bold text-slate-950">
                          {copy.checkIn}: {hotel.checkInTime || "14:00"} - {copy.checkOut}: {hotel.checkOutTime || "12:00"}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500">{copy.contactHint}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={isSoldOut}
                    className={`mt-4 w-full rounded-xl py-3.5 text-sm font-bold transition ${isSoldOut ? "cursor-not-allowed bg-slate-200 text-slate-500" : "bg-gradient-gold text-primary shadow-lg shadow-gold/20 hover:opacity-95 hover:shadow-xl hover:shadow-gold/25 active:scale-[0.98]"}`}
                  >
                    {isSoldOut ? copy.soldOut : copy.bookNow}
                  </button>

                  <Link
                    to={`/hotel/${hotel.id}`}
                    className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-gold/50 hover:text-gold"
                  >
                    <ArrowLeft className="h-4 w-4" /> {copy.backHotel}
                  </Link>
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

export default RoomDetailPage;
