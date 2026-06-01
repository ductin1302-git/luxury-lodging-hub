import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useBooking } from "@/contexts/BookingContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Building2, CheckCircle2, Copy, CreditCard, ExternalLink, Loader2, QrCode, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { apiFetch } from "@/services/apiClient";
import { toast } from "sonner";

type PaymentOption = "full" | "deposit";

const Payment = () => {
  const navigate = useNavigate();
  const { currentBooking, setCurrentBooking } = useBooking();
  const { formatCurrency, language } = useLocale();
  const [method, setMethod] = useState("pay_at_hotel");
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("full");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [momoPayment, setMomoPayment] = useState<any>(null);

  const formatPrice = formatCurrency;
  const copy =
    language === "en"
      ? {
          noBooking: "No booking information",
          findHotel: "Find hotels",
          title: "Payment",
          methodsTitle: "Payment method",
          payAtHotel: "Pay at hotel",
          payAtHotelDesc: "Reserve now and pay when you check in.",
          momo: "MoMo wallet",
          momoDesc: "Scan QR code or open MoMo to complete payment.",
          momoGatewayDesc: "Continue to MoMo to test wallet, ATM/Napas or international card payment.",
          card: "Bank card",
          cardDesc: "Demo payment with domestic or international card.",
          fullPayment: "Pay in full",
          deposit: "Deposit 30%",
          remaining: "remaining",
          cardRequired: "Please enter complete card information",
          redirectMomo: "Redirecting to MoMo payment...",
          success: "Booking completed successfully!",
          paymentError: "An error occurred while processing payment",
          momoSuccess: "MoMo payment completed!",
          momoFailed: "MoMo transaction failed. Please try again.",
          momoPending: "The system has not received MoMo confirmation yet.",
          statusError: "Could not check payment status.",
          copied: "Payment link copied.",
          qrReady: "MoMo QR is ready",
          scanQr: "Scan QR to complete payment",
          bookingCode: "Booking code",
          amountDue: "Amount due",
          paymentType: "Payment type",
          requestCode: "Request code",
          status: "Status",
          pendingPayment: "Pending payment",
          full: "Full",
          openMomo: "Open MoMo",
          copyLink: "Copy link",
          check: "Check",
          summary: "Summary",
          nights: "nights",
          guests: "guests",
          rooms: "rooms",
          room: "Room",
          tax: "Taxes & fees",
          discount: "Discount",
          voucher: "Voucher",
          total: "Total",
          momoPay: "MoMo payment",
          remainingAtHotel: "Due at hotel",
          processing: "Processing...",
          continueMomo: "Continue to MoMo",
          confirm: "Confirm payment",
          securityNote: "Booking information is securely stored. MoMo transactions are confirmed only after the gateway returns a successful result.",
          viewConfirmation: "View booking confirmation",
        }
      : {
          noBooking: "Không có thông tin đặt phòng",
          findHotel: "Tìm khách sạn",
          title: "Thanh toán",
          methodsTitle: "Phương thức thanh toán",
          payAtHotel: "Thanh toán tại khách sạn",
          payAtHotelDesc: "Giữ phòng trước, thanh toán khi nhận phòng.",
          momo: "Ví MoMo",
          momoDesc: "Quét QR hoặc mở ứng dụng MoMo để thanh toán.",
          momoGatewayDesc: "Chuyển sang cổng MoMo để test ví, ATM/Napas hoặc thẻ quốc tế.",
          card: "Thẻ ngân hàng",
          cardDesc: "Thanh toán demo bằng thẻ nội địa/quốc tế.",
          fullPayment: "Thanh toán toàn bộ",
          deposit: "Đặt cọc 30%",
          remaining: "còn lại",
          cardRequired: "Vui lòng nhập đầy đủ thông tin thẻ",
          redirectMomo: "Đang chuyển sang cổng thanh toán MoMo...",
          success: "Đặt phòng thành công!",
          paymentError: "Có lỗi xảy ra khi thanh toán",
          momoSuccess: "Thanh toán MoMo thành công!",
          momoFailed: "Giao dịch MoMo thất bại. Vui lòng thử lại.",
          momoPending: "Hệ thống chưa nhận được kết quả từ MoMo.",
          statusError: "Không thể kiểm tra trạng thái thanh toán.",
          copied: "Đã copy link thanh toán.",
          qrReady: "Mã QR MoMo đã sẵn sàng",
          scanQr: "Quét QR để hoàn tất thanh toán",
          bookingCode: "Mã đặt phòng",
          amountDue: "Số tiền cần thanh toán",
          paymentType: "Hình thức",
          requestCode: "Mã yêu cầu",
          status: "Trạng thái",
          pendingPayment: "Chờ thanh toán",
          full: "Toàn bộ",
          openMomo: "Mở MoMo",
          copyLink: "Copy link",
          check: "Kiểm tra",
          summary: "Tóm tắt",
          nights: "đêm",
          guests: "khách",
          rooms: "phòng",
          room: "Phòng",
          tax: "Thuế & phí",
          discount: "Giảm giá",
          voucher: "Voucher",
          total: "Tổng",
          momoPay: "Thanh toán MoMo",
          remainingAtHotel: "Còn lại tại KS",
          processing: "Đang xử lý...",
          continueMomo: "Chuyển sang cổng MoMo",
          confirm: "Xác nhận thanh toán",
          securityNote: "Thông tin đặt phòng được giữ trong hệ thống. Giao dịch MoMo chỉ được xác nhận khi cổng thanh toán trả về thành công.",
          viewConfirmation: "Xem trang xác nhận đặt phòng",
        };

  const depositAmount = useMemo(() => {
    return Math.max(1000, Math.round(Number(currentBooking?.total || 0) * 0.3));
  }, [currentBooking?.total]);

  const momoAmount = paymentOption === "deposit" ? depositAmount : Number(currentBooking?.total || 0);
  const remainingAmount = Math.max(0, Number(currentBooking?.total || 0) - momoAmount);

  if (!currentBooking?.total) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 text-center py-20">
          <p className="text-xl text-muted-foreground mb-4">{copy.noBooking}</p>
          <button onClick={() => navigate("/hotels")} className="bg-gradient-gold text-primary px-6 py-3 rounded-lg font-semibold">{copy.findHotel}</button>
        </div>
        <Footer />
      </div>
    );
  }

  const methods = [
    {
      id: "pay_at_hotel",
      label: copy.payAtHotel,
      description: copy.payAtHotelDesc,
      icon: Building2,
    },
    {
      id: "momo",
      label: copy.momo,
      description: copy.momoDesc,
      icon: Smartphone,
    },
    {
      id: "card",
      label: copy.card,
      description: copy.cardDesc,
      icon: CreditCard,
    },
  ];

  const buildBookingPayload = () => ({
    hotelId: currentBooking.hotelId,
    roomId: currentBooking.roomId,
    checkIn: currentBooking.checkIn,
    checkOut: currentBooking.checkOut,
    guests: currentBooking.guests,
    roomsCount: currentBooking.rooms,
    nights: currentBooking.nights,
    subtotal: currentBooking.subtotal,
    tax: currentBooking.tax,
    discount: currentBooking.discount,
    total: currentBooking.total,
    guestName: currentBooking.guestName,
    guestEmail: currentBooking.guestEmail,
    guestPhone: currentBooking.guestPhone,
    specialRequest: currentBooking.specialRequest,
    promoCode: currentBooking.promoCode,
    paymentMethod: method,
  });

  const handlePayment = async () => {
    if (method === "card" && (!cardNumber.trim() || !cardExpiry.trim())) {
      toast.error(copy.cardRequired);
      return;
    }

    setLoading(true);
    try {
      const booking = await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify(buildBookingPayload()),
      });

      if (method === "momo") {
        const payment = await apiFetch("/payments/momo/create", {
          method: "POST",
          body: JSON.stringify({ bookingId: booking.id, paymentOption }),
        });

        setCurrentBooking(null);
        sessionStorage.setItem("last_momo_booking_id", payment.bookingId);
        toast.success(copy.redirectMomo);
        window.location.href = payment.payUrl || payment.shortLink;
        return;
      }

      toast.success(copy.success);
      setCurrentBooking(null);
      navigate(`/booking-success?id=${booking.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || copy.paymentError);
    } finally {
      setLoading(false);
    }
  };

  const checkMomoStatus = async () => {
    if (!momoPayment?.bookingId) return;

    setChecking(true);
    try {
      const status = await apiFetch(`/payments/momo/status/${momoPayment.bookingId}`);
      if (status.paymentStatus === "paid") {
        toast.success(copy.momoSuccess);
        navigate(`/booking-success?id=${momoPayment.bookingId}&payment=momo&result=success`);
      } else if (status.paymentStatus === "failed") {
        toast.error(copy.momoFailed);
      } else {
        toast.info(copy.momoPending);
      }
    } catch (error: any) {
      toast.error(error.message || copy.statusError);
    } finally {
      setChecking(false);
    }
  };

  const copyPaymentLink = async () => {
    if (!momoPayment?.payUrl) return;
    await navigator.clipboard.writeText(momoPayment.payUrl);
    toast.success(copy.copied);
  };

  const momoQrUrl = momoPayment?.qrCodeUrl || (
    momoPayment?.payUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(momoPayment.payUrl)}`
      : ""
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-6">{copy.title}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-luxury">
              <h3 className="font-heading font-semibold mb-4">{copy.methodsTitle}</h3>
              <div className="grid gap-3">
                {methods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      method === m.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.id}
                      checked={method === m.id}
                      onChange={() => {
                        setMethod(m.id);
                        setMomoPayment(null);
                      }}
                      className="accent-gold mt-1"
                    />
                    <m.icon className="w-5 h-5 text-gold mt-0.5" />
                    <span>
                      <span className="block font-medium text-sm">{m.label}</span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        {m.id === "momo" ? copy.momoGatewayDesc : m.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {method === "momo" && (
                <div className="mt-5 rounded-xl border border-gold/30 bg-gold/5 p-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className={`p-4 rounded-lg border cursor-pointer ${paymentOption === "full" ? "border-gold bg-white dark:bg-card" : "border-border"}`}>
                      <input type="radio" className="accent-gold mr-2" checked={paymentOption === "full"} onChange={() => setPaymentOption("full")} />
                      <span className="font-semibold text-sm">{copy.fullPayment}</span>
                      <p className="text-xs text-muted-foreground mt-1">{formatPrice(Number(currentBooking.total))}</p>
                    </label>
                    <label className={`p-4 rounded-lg border cursor-pointer ${paymentOption === "deposit" ? "border-gold bg-white dark:bg-card" : "border-border"}`}>
                      <input type="radio" className="accent-gold mr-2" checked={paymentOption === "deposit"} onChange={() => setPaymentOption("deposit")} />
                      <span className="font-semibold text-sm">{copy.deposit}</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPrice(depositAmount)} - {copy.remaining} {formatPrice(remainingAmount)}
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {method === "card" && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="So the"
                    maxLength={19}
                    className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      maxLength={3}
                      className="w-full px-4 py-2.5 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-gold outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {momoPayment && (
              <div className="bg-card rounded-xl p-6 shadow-luxury border border-gold/30 animate-in fade-in slide-in-from-bottom-3">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                      <img src={momoQrUrl} alt="MoMo QR" className="w-56 h-56 object-contain" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 text-pink-700 px-3 py-1 text-xs font-bold mb-3">
                        <QrCode className="w-3.5 h-3.5" /> {copy.qrReady}
                      </div>
                      <h3 className="font-heading text-xl font-bold">{copy.scanQr}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {copy.bookingCode} {momoPayment.bookingCode}. {copy.amountDue}: <span className="font-bold text-gold">{formatPrice(momoPayment.amount)}</span>
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">{copy.paymentType}</p>
                        <p className="font-semibold">{momoPayment.paymentOption === "deposit" ? copy.deposit : copy.full}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">{copy.requestCode}</p>
                        <p className="font-mono text-xs truncate">{momoPayment.requestId}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">{copy.status}</p>
                        <p className="font-semibold text-amber-600">{copy.pendingPayment}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {momoPayment.payUrl && (
                        <a
                          href={momoPayment.payUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-gradient-gold text-primary px-4 py-3 rounded-lg font-semibold hover:opacity-90"
                        >
                          <ExternalLink className="w-4 h-4" /> {copy.openMomo}
                        </a>
                      )}
                      <button onClick={copyPaymentLink} className="inline-flex items-center justify-center gap-2 border border-border px-4 py-3 rounded-lg font-semibold hover:bg-muted">
                        <Copy className="w-4 h-4" /> {copy.copyLink}
                      </button>
                      <button onClick={checkMomoStatus} disabled={checking} className="inline-flex items-center justify-center gap-2 border border-border px-4 py-3 rounded-lg font-semibold hover:bg-muted disabled:opacity-60">
                        {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {copy.check}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-card rounded-xl p-6 shadow-luxury sticky top-20">
              <h3 className="font-heading font-semibold mb-4">{copy.summary}</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{currentBooking.hotelName}</p>
                <p className="text-muted-foreground">{currentBooking.roomName}</p>
                <p className="text-muted-foreground">{currentBooking.checkIn} - {currentBooking.checkOut}</p>
                <p className="text-muted-foreground">{currentBooking.nights} {copy.nights} - {currentBooking.guests} {copy.guests} - {currentBooking.rooms} {copy.rooms}</p>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">{copy.room}</span><span>{formatPrice(currentBooking.subtotal || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{copy.tax}</span><span>{formatPrice(currentBooking.tax || 0)}</span></div>
                  {(currentBooking.discount || 0) > 0 && (
                    <div className="rounded-lg bg-green-50 p-3 text-green-700">
                      <div className="flex justify-between gap-3 font-semibold">
                        <span>
                          {copy.discount}
                          {currentBooking.promoCode ? ` (${currentBooking.promoCode})` : ""}
                        </span>
                        <span>-{formatPrice(currentBooking.discount || 0)}</span>
                      </div>
                      {currentBooking.promoTitle && (
                        <p className="mt-1 text-xs text-green-700/80">
                          {copy.voucher}: {currentBooking.promoTitle}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-lg">
                    <span>{copy.total}</span><span className="text-gold">{formatPrice(currentBooking.total || 0)}</span>
                  </div>
                </div>
              </div>

              {method === "momo" && (
                <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between"><span>{copy.momoPay}</span><span className="font-semibold">{formatPrice(momoAmount)}</span></div>
                  {paymentOption === "deposit" && <div className="flex justify-between text-muted-foreground mt-1"><span>{copy.remainingAtHotel}</span><span>{formatPrice(remainingAmount)}</span></div>}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={loading || Boolean(momoPayment)}
                className="w-full mt-6 bg-gradient-gold text-primary py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {copy.processing}</> : method === "momo" ? copy.continueMomo : copy.confirm}
              </button>

              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-gold flex-shrink-0" />
                <span>{copy.securityNote}</span>
              </div>

              {momoPayment && (
                <button
                  onClick={() => navigate(`/booking-success?id=${momoPayment.bookingId}&payment=momo&result=pending`)}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 text-sm text-gold font-semibold hover:underline"
                >
                  <CheckCircle2 className="w-4 h-4" /> {copy.viewConfirmation}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
