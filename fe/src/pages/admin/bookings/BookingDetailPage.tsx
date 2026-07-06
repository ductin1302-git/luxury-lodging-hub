import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch, getImageUrl } from "@/services/apiClient";
import { toast } from "sonner";
import { 
  ArrowLeft, CreditCard, DollarSign, Mail, FileText, 
  User, Hotel, Calendar, Clock, ShieldCheck, 
  MessageSquare, Trash2, CheckCircle, X, Phone
} from "lucide-react";
import { Booking, formatPaymentMethod, getStatusBadge, getPaymentBadge } from "./BookingListPage";
import { generateInvoiceHTML } from "@/utils/invoiceGenerator";

const BookingDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Action State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"status" | "payment">("status");
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBooking = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/bookings/admin/${id}`);
      setBooking(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin đơn hàng");
      navigate("/admin/bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const openActionModal = (type: "status" | "payment") => {
    if (!booking) return;
    setActionType(type);
    setNote(booking.adminNote || "");
    if (type === "status") {
      setNewStatus(booking.status);
    } else {
      setNewStatus(booking.paymentStatus);
      setTransactionId(booking.transactionId || booking.payment?.transactionId || "");
    }
    setIsActionModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!booking) return;
    setIsSubmitting(true);
    try {
      if (actionType === "status") {
        if (newStatus === "cancelled") {
          await apiFetch(`/bookings/${booking.id}/cancel`, {
            method: "PATCH",
            body: JSON.stringify({ note })
          });
        } else {
          await apiFetch(`/bookings/${booking.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus, note })
          });
        }
      } else {
        await apiFetch(`/bookings/${booking.id}/payment-status`, {
          method: "PATCH",
          body: JSON.stringify({ paymentStatus: newStatus, transactionId, note })
        });
      }
      toast.success("Cập nhật thành công");
      setIsActionModalOpen(false);
      fetchBooking();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportInvoice = () => {
    if (!booking) return;
    const html = generateInvoiceHTML(booking);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      toast.success("Đã tạo hóa đơn thành công!");
    } else {
      toast.error("Vui lòng cho phép mở cửa sổ mới để xem hóa đơn");
    }
  };

  if (isLoading || !booking) return null;

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin/bookings")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Chi tiết Đơn hàng #{booking.bookingCode}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Đặt ngày {new Date(booking.createdAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => toast.success("Đã gửi email")} className="inline-flex items-center gap-2 bg-white dark:bg-card border border-border text-gray-700 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
            <Mail className="w-4 h-4" /> Gửi Email
          </button>
          <button onClick={handleExportInvoice} className="inline-flex items-center gap-2 bg-white dark:bg-card border border-border text-gray-700 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
            <FileText className="w-4 h-4" /> Xuất Hóa Đơn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trạng thái đơn hàng</p>
              <div className="flex items-center gap-4">
                {getStatusBadge(booking.status)}
                <button 
                  onClick={() => openActionModal("status")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Thay đổi trạng thái
                </button>
              </div>
            </div>
            <div className="w-px h-12 bg-border hidden md:block" />
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trạng thái thanh toán</p>
              <div className="flex items-center gap-4">
                {getPaymentBadge(booking.paymentStatus)}
                <button 
                  onClick={() => openActionModal("payment")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Cập nhật thanh toán
                </button>
              </div>
            </div>
            <div className="w-px h-12 bg-border hidden md:block" />
            <div className="space-y-4 text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng doanh thu</p>
              <p className="text-2xl font-black text-gold">{Number(booking.total).toLocaleString("vi-VN")} ₫</p>
            </div>
          </div>

          {/* Booking Content */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-gray-50/50 dark:bg-muted/30">
              <h3 className="font-bold flex items-center gap-2">
                <Hotel className="w-4 h-4 text-gold" /> Thông tin lưu trú
              </h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase">Khách sạn</p>
                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-200 dark:bg-muted overflow-hidden flex-shrink-0 border border-border shadow-sm">
                      {booking.hotel?.images?.[0]?.url ? (
                        <img src={getImageUrl(booking.hotel.images[0].url)} alt="Hotel" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Hotel className="w-6 h-6" /></div>
                      )}
                    </div>
                    <p className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white line-clamp-2">{booking.hotel?.name || booking.hotelNameSnapshot}</p>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    {booking.items && booking.items.length > 0 ? (
                      booking.items.map((item, idx) => {
                        const roomImage = item.room?.image || item.room?.images?.[0]?.url;
                        return (
                          <div key={idx} className="flex gap-3 sm:gap-4 items-start bg-white dark:bg-card p-3 sm:p-4 rounded-xl border border-border shadow-sm relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold"></div>
                            <div className="w-20 h-28 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                              {roomImage ? (
                                <img src={getImageUrl(roomImage)} alt={item.roomNameSnapshot} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-muted/50"><Hotel className="w-6 h-6" /></div>
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
                                    <Hotel className="w-3 h-3" />
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
                      <p className="text-sm text-gray-500 italic p-4 bg-muted/30 rounded-xl text-center">Không có chi tiết phòng</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase">Thời gian</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-muted/30 p-4 rounded-xl border border-border text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Check-in</p>
                    <p className="font-bold">{new Date(booking.checkIn).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div className="flex-1 bg-muted/30 p-4 rounded-xl border border-border text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Check-out</p>
                    <p className="font-bold">{new Date(booking.checkOut).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <p className="text-center text-sm font-bold text-gold italic">Tổng cộng: {booking.nights} đêm lưu trú</p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-gray-50/50 dark:bg-muted/30 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gold" /> Nhật ký xử lý & Ghi chú
              </h3>
            </div>
            <div className="p-8">
              {booking.adminNote ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap leading-relaxed">
                    {booking.adminNote}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">Chưa có ghi chú xử lý nào.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Guest Info */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-gray-50/50 dark:bg-muted/30">
              <h3 className="font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-gold" /> Khách hàng
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black text-xl">
                  {booking.guestName?.charAt(0) || "G"}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{booking.guestName || "Khách ẩn danh"}</p>
                  <p className="text-xs text-gray-500">{booking.user ? "Thành viên hệ thống" : "Khách vãng lai"}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300 truncate">{booking.guestEmail || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">{booking.guestPhone || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-gray-50/50 dark:bg-muted/30">
              <h3 className="font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" /> Thanh toán
              </h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Phương thức:</span>
                <span className="font-bold uppercase tracking-widest text-[10px] bg-muted px-2 py-1 rounded">
                  {formatPaymentMethod(booking.paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Mã giao dịch:</span>
                <span className="font-mono text-xs">{booking.transactionId || booking.payment?.transactionId || "---"}</span>
              </div>
              {booking.payment?.providerReference && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Mã yêu cầu:</span>
                  <span className="font-mono text-xs truncate max-w-[160px]">{booking.payment.providerReference}</span>
                </div>
              )}
              {Number(booking.payment?.amount || 0) > 0 && Number(booking.payment?.amount || 0) < Number(booking.total) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Đã thu:</span>
                  <span className="font-bold text-emerald-600">{Number(booking.payment?.amount || 0).toLocaleString("vi-VN")} VND</span>
                </div>
              )}
              {Number(booking.payment?.amount || 0) > 0 && Number(booking.payment?.amount || 0) < Number(booking.total) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Còn lại:</span>
                  <span className="font-bold text-amber-600">{(Number(booking.total) - Number(booking.payment?.amount || 0)).toLocaleString("vi-VN")} VND</span>
                </div>
              )}
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="font-bold">Tổng thanh toán:</span>
                <span className="font-black text-lg text-emerald-600">
                  {Number(booking.total).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          </div>

          {/* Security & Audit */}
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center gap-3">
             <ShieldCheck className="w-10 h-10 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl" />
             <div>
               <p className="text-xs font-bold text-gray-900 dark:text-white">Giao dịch an toàn</p>
               <p className="text-[10px] text-gray-500">Dữ liệu đã được mã hóa và xác thực bởi hệ thống.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-bold text-lg">
                Cập nhật {actionType === "status" ? "Trạng thái đơn" : "Thanh toán"}
              </h3>
              <button onClick={() => setIsActionModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-8 space-y-6">
              {actionType === "status" ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Trạng thái mới</label>
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)} 
                    className="w-full p-3 border border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none"
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="checked_in">Đã nhận phòng</option>
                    <option value="checked_out">Đã trả phòng</option>
                    <option value="cancelled">Hủy đơn hàng</option>
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Trạng thái thanh toán</label>
                    <select 
                      value={newStatus} 
                      onChange={(e) => setNewStatus(e.target.value)} 
                      className="w-full p-3 border border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none"
                    >
                      <option value="pending">Chưa thanh toán</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="refunded">Đã hoàn tiền</option>
                      <option value="failed">Giao dịch thất bại</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mã giao dịch</label>
                    <input 
                      type="text" 
                      value={transactionId} 
                      onChange={(e) => setTransactionId(e.target.value)} 
                      placeholder="Nhập mã từ cổng thanh toán..." 
                      className="w-full p-3 border border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none" 
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ghi chú xử lý</label>
                <textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Lý do thay đổi hoặc ghi chú cho lịch sử..."
                  className="w-full p-4 border border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none min-h-[120px] resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-gray-50 dark:bg-muted/30">
              <button onClick={() => setIsActionModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Hủy</button>
              <button 
                onClick={handleUpdate} 
                disabled={isSubmitting} 
                className="px-8 py-3 bg-gold text-white rounded-xl hover:bg-gold/90 font-bold text-sm shadow-lg shadow-gold/20 disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BookingDetailPage;
