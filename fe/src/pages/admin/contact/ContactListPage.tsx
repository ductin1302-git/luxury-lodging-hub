import React, { useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";
import {
  Search,
  Mail,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Inbox,
  MailOpen,
} from "lucide-react";
import { apiFetch } from "@/services/apiClient";

// ==========================================
// Types
// ==========================================
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  replyMessage?: string | null;
  date?: string;
  createdAt?: string;
  repliedAt?: string | null;
  status: "new" | "read" | "replied";
}

// ==========================================
// Default Data
// ==========================================
export const defaultMessages: ContactMessage[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    email: "an.nguyen@email.com",
    phone: "0901234567",
    subject: "Hỏi về chính sách hủy phòng",
    message: "Xin chào, tôi muốn biết chính sách hủy phòng miễn phí trong bao nhiêu ngày trước ngày nhận phòng? Tôi đặt phòng tại khách sạn Luxury Stay Nha Trang và muốn thay đổi lịch trình.",
    date: "2026-05-09T10:30:00",
    status: "new",
  },
  {
    id: "2",
    name: "Trần Thị Bích",
    email: "bich.tran@email.com",
    phone: "0912345678",
    subject: "Yêu cầu báo giá tổ chức sự kiện",
    message: "Tôi đang tìm địa điểm tổ chức tiệc cưới cho khoảng 200 khách vào tháng 12. Có thể gửi cho tôi bảng giá các gói sự kiện không?",
    date: "2026-05-08T15:45:00",
    status: "read",
  },
  {
    id: "3",
    name: "Lê Hoàng Minh",
    email: "minh.le@email.com",
    phone: "0923456789",
    subject: "Phản hồi dịch vụ spa",
    message: "Cảm ơn đội ngũ Luxury Stay về trải nghiệm spa tuyệt vời trong chuyến nghỉ dưỡng vừa qua. Tôi rất hài lòng và muốn đặt thêm liệu trình cho lần tới.",
    date: "2026-05-07T09:15:00",
    status: "replied",
  },
  {
    id: "4",
    name: "Phạm Thùy Dung",
    email: "dung.pham@email.com",
    phone: "0934567890",
    subject: "Hợp tác kinh doanh",
    message: "Công ty du lịch của chúng tôi muốn ký kết hợp đồng đối tác lâu dài với Luxury Stay. Vui lòng liên hệ để thảo luận chi tiết về điều khoản và ưu đãi.",
    date: "2026-05-06T14:20:00",
    status: "new",
  },
];

export const statusConfig = {
  new: { label: "Mới", color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Mail },
  read: { label: "Đã đọc", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: MailOpen },
  replied: { label: "Đã phản hồi", color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
};

const ContactListPage = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch("/contacts");
      setMessages(data);
    } catch (error) {
      toast.error("Không thể tải danh sách liên hệ");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchContacts();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
      try {
        await apiFetch(`/contacts/${id}`, { method: "DELETE" });
        toast.success("Đã xóa tin nhắn.");
        fetchContacts();
      } catch (error) {
        toast.error("Lỗi khi xóa tin nhắn");
      }
    }
  };

  const filteredMessages = messages.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Danh sách Liên hệ</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Xem và quản lý các tin nhắn liên hệ từ khách hàng
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-card rounded-xl p-5 border border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <Inbox className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{messages.length}</p>
              <p className="text-xs text-gray-500">Tổng tin nhắn</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-5 border border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {messages.filter((m) => m.status === "new").length}
              </p>
              <p className="text-xs text-gray-500">Chưa đọc</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-5 border border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {messages.filter((m) => m.status === "read").length}
              </p>
              <p className="text-xs text-gray-500">Đã đọc</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-5 border border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {messages.filter((m) => m.status === "replied").length}
              </p>
              <p className="text-xs text-gray-500">Đã phản hồi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-border flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc chủ đề..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="new">Chưa đọc</option>
            <option value="read">Đã đọc</option>
            <option value="replied">Đã phản hồi</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3 font-medium">Người gửi</th>
                <th className="px-6 py-3 font-medium">Chủ đề</th>
                <th className="px-6 py-3 font-medium">Thời gian</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => {
                  const config = statusConfig[msg.status] || statusConfig.new;
                  const StatusIcon = config.icon;
                  return (
                    <tr
                      key={msg.id}
                      className={`border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors ${
                        msg.status === "new" ? "bg-blue-50/30 dark:bg-blue-900/5 font-medium" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            msg.status === "new"
                              ? "bg-gold/20 text-gold shadow-sm"
                              : "bg-gray-100 dark:bg-muted text-gray-500"
                          }`}>
                            {msg.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white">{msg.name}</p>
                            <p className="text-xs text-gray-500">{msg.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="truncate text-gray-900 dark:text-white">{msg.subject}</p>
                          <p className="text-xs text-gray-400 truncate">{msg.message.slice(0, 60)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(msg.createdAt || msg.date).toLocaleDateString("vi-VN")}
                          <span className="text-gray-300">•</span>
                          {new Date(msg.createdAt || msg.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/contact/view/${msg.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy tin nhắn nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContactListPage;
