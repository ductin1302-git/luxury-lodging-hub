import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/common/ScrollReveal";
import { AlertCircle, BedDouble, CalendarDays, CheckCircle, ClipboardList, Clock, Home, Mail, Phone, Printer, Receipt, Sparkles, User, Users, Wallet } from "lucide-react";
import { apiFetch, getImageUrl } from "@/services/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { interpolate, useLocale } from "@/contexts/LocaleContext";
import { toast } from "sonner";

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("id");
  const paymentResult = searchParams.get("result");
  const paymentChannel = searchParams.get("payment");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isLoading: authLoading } = useAuth();
  const { formatCurrency, language, t } = useLocale();

  useEffect(() => {
    if (authLoading) return;

    if (bookingId) {
      apiFetch(`/bookings/${bookingId}`)
        .then((data) => setBooking(data))
        .catch((err) => {
          console.error(err);
          if (err?.status !== 401) {
            toast.error(language === "en" ? "Could not load booking information" : "Không thể tải thông tin đặt phòng");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookingId, authLoading, language]);

  const paymentState = useMemo(() => {
    const status = String(booking?.paymentStatus || "").toLowerCase();
    if (paymentResult === "failed" || status === "failed") return "failed";
    if (paymentResult === "pending" || status === "pending") return "pending";
    return "success";
  }, [booking?.paymentStatus, paymentResult]);

  const copy =
    language === "en"
      ? {
          paymentSuccess: "Payment successful!",
          bookingSuccess: "Booking confirmed!",
          successSubtitle: "Thank you for choosing LuxStay. Your booking information has been recorded.",
          pendingTitle: "Waiting for payment confirmation",
          pendingSubtitle: "Your booking has been created. The system will update after the payment gateway responds.",
          failedTitle: "Payment not completed",
          failedSubtitle: "The transaction has not been confirmed. You can try again or contact the hotel for support.",
          bookingCode: "Booking code",
          qrHint: "QR contains booking code, guest details and payment status",
          customer: "Guest information",
          fullName: "Full name",
          phone: "Phone",
          stay: "Stay information",
          hotel: "Hotel",
          roomType: "Room type",
          nights: "Nights",
          status: "Status",
          receipt: "Payment receipt",
          gateway: "Payment gateway",
          paymentStatus: "Payment status",
          transaction: "MoMo transaction ID",
          requestCode: "Request code",
          recordedAt: "Recorded at",
          paid: "Paid",
          remainingAtHotel: "Due at hotel",
          roomCharge: "Room charge",
          tax: "Taxes & fees",
          discount: "Discount",
          voucherProgram: "Voucher program",
          total: "Total booking value",
          notFound: "This booking could not be found.",
          home: "Home",
          history: "Booking history",
          print: "Print voucher",
          payAtHotel: "Pay at hotel",
          card: "Bank card",
          night: "night",
        }
      : {
          paymentSuccess: "Thanh toán thành công!",
          bookingSuccess: "Đặt phòng thành công!",
          successSubtitle: "Cảm ơn bạn đã tin tưởng LuxStay. Thông tin đặt phòng đã được ghi nhận.",
          pendingTitle: "Đang chờ xác nhận thanh toán",
          pendingSubtitle: "Đặt phòng đã được tạo. Hệ thống sẽ cập nhật khi cổng thanh toán gửi kết quả.",
          failedTitle: "Thanh toán chưa thành công",
          failedSubtitle: "Giao dịch chưa được xác nhận. Bạn có thể thử lại hoặc liên hệ khách sạn để được hỗ trợ.",
          bookingCode: "Mã đặt phòng",
          qrHint: "QR chứa mã đặt phòng, thông tin khách và trạng thái thanh toán",
          customer: "Thông tin khách hàng",
          fullName: "Họ tên",
          phone: "Điện thoại",
          stay: "Thông tin lưu trú",
          hotel: "Khách sạn",
          roomType: "Loại phòng",
          nights: "Số đêm",
          status: "Trạng thái",
          receipt: "Biên lai thanh toán",
          gateway: "Cổng thanh toán",
          paymentStatus: "Trạng thái thanh toán",
          transaction: "Mã giao dịch MoMo",
          requestCode: "Mã yêu cầu",
          recordedAt: "Thời gian ghi nhận",
          paid: "Đã thanh toán",
          remainingAtHotel: "Còn lại tại khách sạn",
          roomCharge: "Tiền phòng",
          tax: "Thuế và phí",
          discount: "Giảm giá",
          voucherProgram: "Chương trình voucher",
          total: "Tổng giá trị đặt phòng",
          notFound: "Không tìm thấy thông tin đặt phòng này.",
          home: "Trang chủ",
          history: "Lịch sử booking",
          print: "In phiếu",
          payAtHotel: "Thanh toán tại khách sạn",
          card: "Thẻ ngân hàng",
          night: "đêm",
        };

  const stateCopy = {
    success: {
      title: paymentChannel === "momo" ? copy.paymentSuccess : copy.bookingSuccess,
      subtitle: copy.successSubtitle,
      icon: CheckCircle,
      iconWrap: "bg-green-100",
      iconColor: "text-green-600",
      ring: "border-green-300",
    },
    pending: {
      title: copy.pendingTitle,
      subtitle: copy.pendingSubtitle,
      icon: Clock,
      iconWrap: "bg-amber-100",
      iconColor: "text-amber-600",
      ring: "border-amber-300",
    },
    failed: {
      title: copy.failedTitle,
      subtitle: copy.failedSubtitle,
      icon: AlertCircle,
      iconWrap: "bg-red-100",
      iconColor: "text-red-600",
      ring: "border-red-300",
    },
  }[paymentState];

  const StateIcon = stateCopy.icon;
  const formatPrice = formatCurrency;
  const dateLocale = language === "en" ? "en-US" : "vi-VN";
  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" }) : "---";
  const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString(dateLocale, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "---";
  const paymentMethodLabel = (method?: string) => {
    if (method === "ewallet" || method === "momo") return "MoMo";
    if (method === "pay_at_hotel") return copy.payAtHotel;
    if (method === "card") return copy.card;
    return (method || "---").replace(/_/g, " ");
  };
  const paidAmount = Number(booking?.payment?.amount || 0);
  const remainingAmount = Math.max(0, Number(booking?.total || 0) - paidAmount);
  const roomName = booking?.items?.[0]?.roomNameSnapshot || booking?.items?.[0]?.room?.name || booking?.roomName || "---";
  const promotion = booking?.promotion;
  const promotionCode = promotion?.code || booking?.promoCode || "";
  const qrPayload = booking ? JSON.stringify({
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    hotel: booking.hotel?.name || booking.hotelNameSnapshot,
    room: roomName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    paymentStatus: booking.paymentStatus,
    transactionId: booking.transactionId || booking.payment?.transactionId || "",
  }) : "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 py-16 page-enter">
        <div className="max-w-2xl mx-auto text-center">
          <div className={`w-24 h-24 mx-auto mb-6 ${stateCopy.iconWrap} rounded-full flex items-center justify-center animate-scale-in relative`}>
            <StateIcon className={`w-12 h-12 ${stateCopy.iconColor}`} />
            <div className={`absolute inset-0 rounded-full border-2 ${stateCopy.ring} animate-ping opacity-20`} />
          </div>

          <h1 className="font-heading text-3xl font-bold mb-2 animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {stateCopy.title}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <Sparkles className="w-4 h-4 text-gold" />
            <p className="text-muted-foreground">{stateCopy.subtitle}</p>
            <Sparkles className="w-4 h-4 text-gold" />
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : booking ? (
            <ScrollReveal>
              <div className="bg-card rounded-xl shadow-luxury text-left mb-8 overflow-hidden hover-lift">
                <div className="bg-gold/10 p-6 text-center border-b border-gold/20 relative overflow-hidden">
                  <div className="absolute inset-0 shimmer-bg" />
                  <div className="relative z-10">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">{copy.bookingCode}</p>
                    <p className="text-3xl font-mono font-bold text-gold mb-4">{booking.bookingCode || booking.id}</p>
                    <div className="bg-white p-3 inline-block rounded-lg shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${encodeURIComponent(qrPayload)}`}
                        alt="Booking QR Code"
                        className="w-44 h-44"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 italic">{copy.qrHint}</p>
                  </div>
                </div>

                <div className="p-6 space-y-6 text-sm">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-4 bg-muted/20">
                      <div className="flex items-center gap-2 font-bold mb-3"><User className="w-4 h-4 text-gold" /> {copy.customer}</div>
                      <div className="space-y-2">
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground">{copy.fullName}</span><span className="font-medium text-right">{booking.guestName}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground inline-flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span><span className="font-medium text-right break-all">{booking.guestEmail}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-muted-foreground inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {copy.phone}</span><span className="font-medium text-right">{booking.guestPhone}</span></div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden bg-muted/5">
                      <div className="bg-muted/20 px-4 py-3 border-b border-border flex items-center gap-2 font-bold"><BedDouble className="w-4 h-4 text-gold" /> {copy.stay}</div>
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-muted overflow-hidden flex-shrink-0 border border-border shadow-sm">
                            {booking.hotel?.images?.[0]?.url ? (
                              <img src={getImageUrl(booking.hotel.images[0].url)} alt="Hotel" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400"><Home className="w-5 h-5" /></div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-0.5">{copy.hotel}</span>
                            <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white line-clamp-1">{booking.hotel?.name || booking.hotelNameSnapshot}</span>
                          </div>
                        </div>
                        <div className="pt-2 space-y-4">
                          {booking.items && booking.items.length > 0 ? (
                            booking.items.map((item: any, idx: number) => {
                              const roomImg = item.room?.image || item.room?.images?.[0]?.url;
                              return (
                                <div key={idx} className="flex gap-3 sm:gap-4 items-start bg-white dark:bg-card p-3 sm:p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group">
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold"></div>
                                  <div className="w-20 h-28 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                                    {roomImg ? (
                                      <img src={getImageUrl(roomImg)} alt={item.roomNameSnapshot} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-muted/50"><Home className="w-6 h-6" /></div>
                                    )}
                                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                      {item.nights || booking.nights} đêm
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
                                    <div>
                                      <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2" title={item.roomNameSnapshot}>
                                        {item.roomNameSnapshot}
                                      </p>
                                      <p className="text-xs text-gray-500 font-medium mt-1">Giá: {Number(item.roomPriceSnapshot || 0).toLocaleString("vi-VN")} ₫ / đêm</p>
                                      
                                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-1 rounded font-semibold">
                                          <BedDouble className="w-3 h-3" />
                                          <span>{item.roomsCount} phòng</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-muted px-1.5 py-1 rounded font-medium">
                                          <User className="w-3 h-3" />
                                          <span>{item.guestsPerRoom} khách/ph</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3 bg-gold/10 px-3 py-1.5 rounded-lg border border-gold/20 flex justify-between items-center w-full">
                                      <span className="text-[10px] uppercase text-gold font-bold tracking-wider">Thành tiền</span>
                                      <span className="font-black text-gold text-sm sm:text-base">{Number(item.lineSubtotal || 0).toLocaleString("vi-VN")} ₫</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex justify-between gap-4 p-4 bg-muted/30 rounded-xl"><span className="text-muted-foreground">{copy.roomType}</span><span className="text-right font-medium">{roomName}</span></div>
                          )}
                        </div>
                        <div className="flex justify-between gap-4 pt-4 border-t border-border"><span className="text-muted-foreground inline-flex items-center gap-1 font-medium"><Users className="w-4 h-4 text-gold" /> {t("booking.guestRoom")}</span><span className="font-bold text-base">{interpolate(t("hotels.guestCount"), { count: booking.guests || 0 })} - {interpolate(t("hotels.roomCount"), { count: booking.roomsCount || 0 })}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border p-4 text-center">
                      <CalendarDays className="w-4 h-4 text-gold mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Check-in</p>
                      <p className="font-medium">{formatDate(booking.checkIn)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4 text-center">
                      <CalendarDays className="w-4 h-4 text-gold mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Check-out</p>
                      <p className="font-medium">{formatDate(booking.checkOut)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4 text-center">
                      <Clock className="w-4 h-4 text-gold mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{copy.nights}</p>
                      <p className="font-medium">{booking.nights} {copy.night}</p>
                    </div>
                    <div className="rounded-xl border border-border p-4 text-center">
                      <Receipt className="w-4 h-4 text-gold mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{copy.status}</p>
                      <p className="font-medium uppercase">{booking.status}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="p-4 bg-muted/30 font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-gold" /> {copy.receipt}</div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">{copy.gateway}</span><span className="font-semibold">{paymentMethodLabel(booking.paymentMethod)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{copy.paymentStatus}</span><span className="font-semibold uppercase">{booking.paymentStatus}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{copy.transaction}</span><span className="font-mono text-xs">{booking.transactionId || booking.payment?.transactionId || "---"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{copy.requestCode}</span><span className="font-mono text-xs text-right truncate max-w-[220px]">{booking.payment?.providerReference || "---"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{copy.recordedAt}</span><span>{formatDateTime(booking.payment?.paidAt || booking.updatedAt)}</span></div>
                      <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">{copy.roomCharge}</span><span>{formatPrice(Number(booking.subtotal || 0))}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{copy.tax}</span><span>{formatPrice(Number(booking.tax || 0))}</span></div>
                      {Number(booking.discount || 0) > 0 && (
                        <div className="rounded-lg bg-green-50 p-3 text-green-700">
                          <div className="flex justify-between gap-3 font-semibold">
                            <span>{promotionCode ? `${copy.discount} (${promotionCode})` : copy.discount}</span>
                            <span>-{formatPrice(Number(booking.discount || 0))}</span>
                          </div>
                          {promotion?.title && (
                            <p className="mt-1 text-xs text-green-700/80">{copy.voucherProgram}: {promotion.title}</p>
                          )}
                        </div>
                      )}
                      {paidAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 border-t border-border pt-2"><span>{copy.paid}</span><span className="font-semibold">{formatPrice(paidAmount)}</span></div>
                      )}
                      {paidAmount > 0 && paidAmount < Number(booking.total) && (
                        <div className="flex justify-between text-amber-600"><span>{copy.remainingAtHotel}</span><span className="font-semibold">{formatPrice(remainingAmount)}</span></div>
                      )}
                      <div className="flex justify-between font-semibold text-base border-t border-border pt-3 mt-1">
                        <span>{copy.total}</span><span className="text-gold">{formatPrice(Number(booking.total))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ) : (
            <p className="text-muted-foreground mb-8 animate-fade-in">{copy.notFound}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-gradient-gold text-primary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 duration-300">
              <Home className="w-4 h-4" /> {copy.home}
            </Link>
            <Link to="/my-bookings" className="inline-flex items-center justify-center gap-2 border-2 border-gold text-gold px-6 py-3 rounded-lg font-semibold hover:bg-gold hover:text-primary transition-all hover:scale-105 active:scale-95 duration-300">
              <ClipboardList className="w-4 h-4" /> {copy.history}
            </Link>
            {booking && (
              <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 border-2 border-border px-6 py-3 rounded-lg font-semibold hover:bg-muted transition-all">
                <Printer className="w-4 h-4" /> {copy.print}
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingSuccess;
