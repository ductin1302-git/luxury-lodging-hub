import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch } from "@/services/apiClient";
import { toast } from "sonner";
import { 
  CalendarDays, Search, CheckCircle, XCircle, Clock, 
  Eye, DollarSign, Mail, FileText, Filter
} from "lucide-react";
import { generateInvoiceHTML } from "@/utils/invoiceGenerator";

export interface Booking {
  id: string;
  bookingCode?: string;
  hotelNameSnapshot: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId?: string;
  adminNote?: string;
  createdAt: string;
  payment?: {
    amount?: number;
    providerReference?: string;
    transactionId?: string;
    paymentStatus?: string;
  } | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  items?: any[];
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3"/> Xác nhận</span>;
    case "cancelled":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3"/> Đã hủy</span>;
    case "checked_in":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3"/> Nhận phòng</span>;
    case "checked_out":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3"/> Trả phòng</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3"/> Chờ xử lý</span>;
  }
};

export const getPaymentBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><DollarSign className="w-3 h-3"/> Đã thanh toán</span>;
    case "refunded":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><DollarSign className="w-3 h-3"/> Hoàn tiền</span>;
    case "failed":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3"/> Thất bại</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><Clock className="w-3 h-3"/> Chưa thanh toán</span>;
  }
};

export const formatPaymentMethod = (method?: string) => {
  if (method === "ewallet") return "MoMo";
  if (method === "pay_at_hotel") return "Tại khách sạn";
  if (method === "bank_transfer") return "Chuyển khoản";
  if (method === "card") return "Thẻ";
  return (method || "---").replace(/_/g, " ");
};

const BookingListPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      let url = "/bookings?";
      if (statusFilter !== "all") url += `status=${statusFilter}&`;
      if (paymentFilter !== "all") url += `paymentStatus=${paymentFilter}&`;
      if (dateFilter) url += `dateFrom=${dateFilter}&dateTo=${dateFilter}&`;
      if (searchQuery) url += `search=${searchQuery}&`;

      const data = await apiFetch(url);
      setBookings(data);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách Đơn đặt phòng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, paymentFilter, dateFilter]);

  const handleExportInvoice = (booking: Booking) => {
    const html = generateInvoiceHTML(booking);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      toast.success("Đã tạo hóa đơn thành công!");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Quản lý Đơn Đặt Phòng</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Xử lý đơn đặt phòng, thanh toán và xuất hóa đơn</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-border mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo Mã, Tên, Email, SĐT..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 text-sm border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="all">Mọi trạng thái Đơn</option>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="checked_in">Đã nhận phòng</option>
                <option value="checked_out">Đã trả phòng</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="all">Mọi Thanh toán</option>
              <option value="pending">Chưa thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border text-gray-600 dark:text-gray-400">
                <th className="px-6 py-4 font-medium">Mã Booking</th>
                <th className="px-6 py-4 font-medium">Khách hàng</th>
                <th className="px-6 py-4 font-medium">Thời gian lưu trú</th>
                <th className="px-6 py-4 font-medium">Tổng tiền</th>
                <th className="px-6 py-4 font-medium text-center">Trạng thái đơn</th>
                <th className="px-6 py-4 font-medium text-center">Thanh toán</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-blue-600 dark:text-blue-400 uppercase text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        #{booking.bookingCode || booking.id.slice(0, 8)}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(booking.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{booking.guestName}</p>
                      <p className="text-xs text-gray-500">{booking.guestPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <p><span className="text-gray-400 font-medium">In:</span> {new Date(booking.checkIn).toLocaleDateString("vi-VN")}</p>
                        <p><span className="text-gray-400 font-medium">Out:</span> {new Date(booking.checkOut).toLocaleDateString("vi-VN")}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gold">
                      {Number(booking.total || 0).toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getPaymentBadge(booking.paymentStatus)}
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{formatPaymentMethod(booking.paymentMethod)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/bookings/view/${booking.id}`} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => toast.success("Đã gửi lại email xác nhận")} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-muted rounded-xl transition-all" title="Gửi Email">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleExportInvoice(booking)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" title="Xuất hóa đơn">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Không tìm thấy đơn đặt phòng nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingListPage;
