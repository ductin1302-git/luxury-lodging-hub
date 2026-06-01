import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/common/ScrollReveal";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Tag } from "lucide-react";
import { apiFetch } from "@/services/apiClient";
import { toast } from "sonner";

type Promotion = {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: "percent" | "amount";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
  promotion_hotels?: { hotelId: string }[];
  promotion_rooms?: { roomId: string }[];
};

const getDayStartTime = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const getPromotionDiscountAmount = (promotion: Promotion, subtotal: number) => {
  const discountValue = Number(promotion.discountValue || 0);
  const isPercentDiscount = promotion.discountType === "percent" && discountValue <= 100;
  const rawDiscount = isPercentDiscount ? Math.round((subtotal * discountValue) / 100) : Math.round(discountValue);
  const cappedDiscount = promotion.maxDiscountAmount
    ? Math.min(rawDiscount, Number(promotion.maxDiscountAmount))
    : rawDiscount;

  return Math.min(subtotal, Math.max(0, cappedDiscount));
};

const Booking = () => {
  const navigate = useNavigate();
  const { currentBooking, setCurrentBooking } = useBooking();
  const { user } = useAuth();
  const { formatCurrency, language } = useLocale();
  const [checkIn, setCheckIn] = useState(currentBooking?.checkIn || "");
  const [checkOut, setCheckOut] = useState(currentBooking?.checkOut || "");
  const [guests, setGuests] = useState(currentBooking?.guests || 2);
  const [rooms, setRooms] = useState(currentBooking?.rooms || 1);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [request, setRequest] = useState("");
  const [promo, setPromo] = useState("");
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [arrivalTime, setArrivalTime] = useState("14:00");

  const copy =
    language === "en"
      ? {
          noRoom: "No room selected",
          findHotel: "Find hotels",
          title: "Booking details",
          perNight: "/ night",
          bookingInfo: "Stay details",
          checkIn: "Check-in date *",
          checkOut: "Check-out date *",
          guests: "Guests",
          rooms: "Rooms",
          arrivalTime: "Estimated arrival time",
          guestInfo: "Guest information",
          fullName: "Full name *",
          phone: "Phone number *",
          specialRequest: "Special request",
          requestPlaceholder: "Example: high floor, extra bed...",
          priceDetails: "Price details",
          nights: "nights",
          roomsLabel: "rooms",
          tax: "Taxes & fees (10%)",
          discount: "Discount",
          total: "Total",
          promoPlaceholder: "Promo code",
          apply: "Apply",
          applied: "Applied",
          voucherRequired: "Please enter a voucher code.",
          voucherInvalid: "This voucher is not valid for the selected booking.",
          voucherExpired: "This voucher is not active right now.",
          voucherUsageEnded: "This voucher has reached its usage limit.",
          voucherMinOrder: "Minimum order required",
          removeVoucher: "Remove",
          voucherDetail: "Voucher applied",
          continue: "Continue to payment",
          pastDate: "Check-in date cannot be in the past.",
          invalidCheckout: "Check-out date must be after check-in date.",
        }
      : {
          noRoom: "Chưa chọn phòng nào",
          findHotel: "Tìm khách sạn",
          title: "Đặt phòng",
          perNight: "/đêm",
          bookingInfo: "Thông tin đặt phòng",
          checkIn: "Ngày nhận phòng *",
          checkOut: "Ngày trả phòng *",
          guests: "Số khách",
          rooms: "Số phòng",
          arrivalTime: "Giờ nhận phòng dự kiến",
          guestInfo: "Thông tin khách hàng",
          fullName: "Họ và tên *",
          phone: "Số điện thoại *",
          specialRequest: "Yêu cầu đặc biệt",
          requestPlaceholder: "VD: Phòng tầng cao, giường phụ...",
          priceDetails: "Chi tiết giá",
          nights: "đêm",
          roomsLabel: "phòng",
          tax: "Thuế & phí (10%)",
          discount: "Giảm giá",
          total: "Tổng",
          promoPlaceholder: "Mã giảm giá",
          apply: "Áp dụng",
          applied: "Đã áp dụng",
          voucherRequired: "Vui lòng nhập mã voucher.",
          voucherInvalid: "Voucher này không hợp lệ cho đơn đặt phòng đã chọn.",
          voucherExpired: "Voucher này hiện không trong thời gian áp dụng.",
          voucherUsageEnded: "Voucher này đã hết lượt sử dụng.",
          voucherMinOrder: "Đơn tối thiểu cần đạt",
          removeVoucher: "Gỡ",
          voucherDetail: "Voucher đang áp dụng",
          continue: "Tiếp tục thanh toán",
          pastDate: "Ngày nhận phòng không thể ở quá khứ.",
          invalidCheckout: "Ngày trả phòng phải sau ngày nhận phòng.",
        };

  const guestOption = (count: number) => (language === "en" ? `${count} guest${count > 1 ? "s" : ""}` : `${count} khách`);
  const roomOption = (count: number) => (language === "en" ? `${count} room${count > 1 ? "s" : ""}` : `${count} phòng`);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/promotions")
      .then((data) => {
        if (!cancelled) {
          setAvailablePromotions(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        console.error("Failed to load promotions", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!currentBooking?.hotelName) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 text-center py-20 page-enter">
          <p className="text-xl text-muted-foreground mb-4">{copy.noRoom}</p>
          <button onClick={() => navigate("/hotels")} className="bg-gradient-gold text-primary px-6 py-3 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-transform">{copy.findHotel}</button>
        </div>
        <Footer />
      </div>
    );
  }

  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;
  const roomPrice = currentBooking.roomPrice || 0;
  const subtotal = roomPrice * nights * rooms;
  const tax = Math.round(subtotal * 0.1);
  const isPromotionUsable = (promotion: Promotion) => {
    if (!promotion.isActive) return false;

    const today = getDayStartTime();
    const startTime = promotion.startDate ? getDayStartTime(promotion.startDate) : null;
    const endTime = promotion.endDate ? getDayStartTime(promotion.endDate) : null;

    if ((startTime !== null && startTime > today) || (endTime !== null && endTime < today)) return false;
    if (promotion.usageLimit && Number(promotion.usedCount || 0) >= Number(promotion.usageLimit)) return false;
    if (promotion.minOrderAmount && subtotal < Number(promotion.minOrderAmount)) return false;

    const scopedHotels = promotion.promotion_hotels || [];
    const scopedRooms = promotion.promotion_rooms || [];
    if (scopedHotels.length && !scopedHotels.some((item) => item.hotelId === currentBooking.hotelId)) return false;
    if (scopedRooms.length && !scopedRooms.some((item) => item.roomId === currentBooking.roomId)) return false;

    return true;
  };
  const validAppliedPromotion = appliedPromotion && isPromotionUsable(appliedPromotion) ? appliedPromotion : null;
  const discountAmount = validAppliedPromotion ? getPromotionDiscountAmount(validAppliedPromotion, subtotal) : 0;
  const total = Math.max(0, subtotal + tax - discountAmount);
  const formatPrice = formatCurrency;

  const applyPromo = () => {
    const normalizedCode = promo.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error(copy.voucherRequired);
      return;
    }

    const found = availablePromotions.find((p) => p.code.toUpperCase() === normalizedCode);
    if (!found) {
      setAppliedPromotion(null);
      toast.error(copy.voucherInvalid);
      return;
    }

    if (!found.isActive) {
      setAppliedPromotion(null);
      toast.error(copy.voucherExpired);
      return;
    }

    if (found.usageLimit && Number(found.usedCount || 0) >= Number(found.usageLimit)) {
      setAppliedPromotion(null);
      toast.error(copy.voucherUsageEnded);
      return;
    }

    if (found.minOrderAmount && subtotal < Number(found.minOrderAmount)) {
      setAppliedPromotion(null);
      toast.error(`${copy.voucherMinOrder}: ${formatPrice(Number(found.minOrderAmount))}`);
      return;
    }

    if (!isPromotionUsable(found)) {
      setAppliedPromotion(null);
      toast.error(copy.voucherInvalid);
      return;
    }

    const nextDiscount = getPromotionDiscountAmount(found, subtotal);
    if (nextDiscount <= 0) {
      setAppliedPromotion(null);
      toast.error(copy.voucherInvalid);
      return;
    }

    setAppliedPromotion(found);
    setPromo(found.code);
    toast.success(`${copy.applied} ${found.code}: -${formatPrice(nextDiscount)}`);
  };

  const getPromotionLabel = (promotion: Promotion) => {
    const value = Number(promotion.discountValue || 0);
    return promotion.discountType === "percent" && value <= 100 ? `${value}%` : formatPrice(value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || !name || !email || !phone) return;
    
    // Final validation check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);

    if (ciDate < today) {
      alert(copy.pastDate);
      return;
    }
    if (coDate <= ciDate) {
      alert(copy.invalidCheckout);
      return;
    }

    setCurrentBooking({
      ...currentBooking,
      checkIn, checkOut, guests, rooms, nights, subtotal, tax, discount: discountAmount, total,
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      specialRequest: request,
      promoCode: validAppliedPromotion?.code || "",
      promoTitle: validAppliedPromotion?.title,
      promoDiscountType: validAppliedPromotion?.discountType,
      promoDiscountValue: validAppliedPromotion ? Number(validAppliedPromotion.discountValue || 0) : undefined,
      promoMinOrderAmount: validAppliedPromotion ? Number(validAppliedPromotion.minOrderAmount || 0) : undefined,
      arrivalTime: arrivalTime,
    });
    navigate("/payment");
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const minCheckOutStr = checkIn 
    ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0]
    : todayStr;

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    // If new checkIn is after current checkOut, update checkOut to checkIn + 1 day
    if (checkOut && new Date(val) >= new Date(checkOut)) {
      const nextDay = new Date(new Date(val).getTime() + 86400000);
      setCheckOut(nextDay.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 py-8 page-enter">
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-6 animate-fade-in-down" style={{ animationDelay: "0.1s", opacity: 0 }}>{copy.title}</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Hotel info */}
              <ScrollReveal>
                <div className="bg-card rounded-xl p-6 shadow-luxury hover-lift">
                  <h2 className="font-heading text-lg font-semibold mb-2">{currentBooking.hotelName}</h2>
                  <p className="text-gold font-medium">{currentBooking.roomName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{formatPrice(roomPrice)}{copy.perNight}</p>
                </div>
              </ScrollReveal>

              {/* Dates */}
              <ScrollReveal delay={1}>
                <div className="bg-card rounded-xl p-6 shadow-luxury hover-lift">
                  <h3 className="font-heading font-semibold mb-4">{copy.bookingInfo}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">{copy.checkIn}</label>
                      <input type="date" value={checkIn} min={todayStr} onChange={(e) => handleCheckInChange(e.target.value)} required
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none transition-shadow duration-300" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{copy.checkOut}</label>
                      <input type="date" value={checkOut} min={minCheckOutStr} onChange={(e) => setCheckOut(e.target.value)} required
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none transition-shadow duration-300" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{copy.guests}</label>
                      <select value={guests} onChange={(e) => setGuests(+e.target.value)}
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none">
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{guestOption(n)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{copy.rooms}</label>
                      <select value={rooms} onChange={(e) => setRooms(+e.target.value)}
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none">
                        {[1,2,3,4].map(n => <option key={n} value={n}>{roomOption(n)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{copy.arrivalTime}</label>
                      <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)}
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Guest info */}
              <ScrollReveal delay={2}>
                <div className="bg-card rounded-xl p-6 shadow-luxury hover-lift">
                  <h3 className="font-heading font-semibold mb-4">{copy.guestInfo}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium mb-1 block">{copy.fullName}</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none transition-shadow duration-300" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email *</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com"
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none transition-shadow duration-300" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{copy.phone}</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0901234567"
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none transition-shadow duration-300" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium mb-1 block">{copy.specialRequest}</label>
                      <textarea value={request} onChange={(e) => setRequest(e.target.value)} placeholder={copy.requestPlaceholder}
                        className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none h-24 resize-none transition-shadow duration-300" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Summary sidebar */}
            <div>
              <div className="bg-card rounded-xl p-6 shadow-luxury sticky top-20 animate-fade-in-right hover-lift" style={{ animationDelay: "0.3s", opacity: 0 }}>
                <h3 className="font-heading font-semibold mb-4">{copy.priceDetails}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{formatPrice(roomPrice)} x {nights} {copy.nights} x {rooms} {copy.roomsLabel}</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{copy.tax}</span><span>{formatPrice(tax)}</span></div>
                  {discountAmount > 0 && validAppliedPromotion && (
                    <div className="flex justify-between gap-3 text-green-600 animate-fade-in">
                      <span>{copy.discount} ({validAppliedPromotion.code})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
                    <span>{copy.total}</span><span className="text-gold">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Promo */}
                <div className="mt-4">
                  <div className="flex gap-2">
                    <input type="text" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder={copy.promoPlaceholder}
                      className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none transition-shadow duration-300" />
                    <button type="button" onClick={applyPromo} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all active:scale-95">
                      {copy.apply}
                    </button>
                  </div>
                  {validAppliedPromotion && (
                    <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 animate-fade-in">
                      <div className="flex items-start justify-between gap-3">
                        <p className="flex items-center gap-1 font-semibold">
                          <Tag className="w-3 h-3" /> {copy.voucherDetail}: {validAppliedPromotion.code}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromotion(null);
                            setPromo("");
                          }}
                          className="font-semibold hover:underline"
                        >
                          {copy.removeVoucher}
                        </button>
                      </div>
                      <p className="mt-1 text-green-700/80">
                        {validAppliedPromotion.title} - {getPromotionLabel(validAppliedPromotion)}
                      </p>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full mt-6 bg-gradient-gold text-primary py-3 rounded-lg font-semibold hover:opacity-90 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95 duration-300">
                  {copy.continue}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Booking;
