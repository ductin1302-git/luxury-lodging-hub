import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch } from "@/services/apiClient";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Calendar,
  Trash2,
  Reply,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { ContactMessage, statusConfig } from "./ContactListPage";

const ContactDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { refreshNotifications, markAsRead } = useNotifications();

  const fetchMessage = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await apiFetch(`/contacts/${id}`);
      if (!data) {
        toast.error("Không tìm thấy tin nhắn");
        navigate("/admin/contact");
        return;
      }

      setMessage(data);
      setReplyText(data.replyMessage || "");
      markAsRead(`admin-contact:${id}`);
      if (data.status === "new") {
        await apiFetch(`/contacts/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "read" }),
        }).catch(() => null);
        setMessage({ ...data, status: "read" });
        refreshNotifications().catch(() => null);
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải chi tiết liên hệ");
      navigate("/admin/contact");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const handleReply = async () => {
    if (!id || !message) return;
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    const replyContent = replyText.trim();

    try {
      await apiFetch(`/contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "replied",
          replyMessage: replyContent,
        }),
      });
      toast.success("Đã cập nhật phản hồi cho khách hàng.");
      setReplyText("");
      setShowReplyForm(false);
      setMessage({
        ...message,
        status: "replied",
        replyMessage: replyContent,
        repliedAt: new Date().toISOString(),
      });
      refreshNotifications().catch(() => null);
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật trạng thái phản hồi");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) return;

    try {
      await apiFetch(`/contacts/${id}`, { method: "DELETE" });
      toast.success("Đã xóa tin nhắn.");
      refreshNotifications().catch(() => null);
      navigate("/admin/contact");
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa tin nhắn");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[420px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  if (!message) return null;

  const config = statusConfig[message.status] || statusConfig.new;
  const StatusIcon = config.icon;
  const sentAt = message.createdAt || message.date;

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/contact")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Chi tiết tin nhắn</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Tin nhắn từ {message.name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nội dung tin nhắn</h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {message.subject}
              </h3>
              <div className="bg-gray-50 dark:bg-muted rounded-2xl p-6 mb-8 min-h-[200px]">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {message.message}
                </p>
              </div>

              {message.replyMessage && !showReplyForm && (
                <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-emerald-700">Phản hồi đã lưu</p>
                    {message.repliedAt && (
                      <span className="text-xs text-emerald-600">
                        {new Date(message.repliedAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {message.replyMessage}
                  </p>
                </div>
              )}

              {showReplyForm ? (
                <div className="space-y-4 border-t border-gray-100 dark:border-border pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                       <Reply className="w-4 h-4 text-gold" /> Soạn phản hồi
                    </label>
                    <button
                      onClick={() => setShowReplyForm(false)}
                      className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Hủy bỏ
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted text-sm focus:ring-2 focus:ring-gold outline-none transition-all resize-none"
                    placeholder="Nhập nội dung phản hồi đã gửi cho khách hàng..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleReply}
                      className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 active:scale-95"
                    >
                      <Reply className="w-4 h-4" /> Đánh dấu đã phản hồi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 border-t border-gray-100 dark:border-border pt-8">
                  <button
                    onClick={() => setShowReplyForm(true)}
                    className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 active:scale-95 flex-1 justify-center"
                  >
                    <Reply className="w-4 h-4" /> Phản hồi khách hàng
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 border border-red-200 text-red-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa tin nhắn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-border">
              <h3 className="font-bold text-gray-900 dark:text-white">Thông tin khách hàng</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-lg shadow-inner">
                  {message.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{message.name}</p>
                  <p className="text-xs text-gray-500">Khách vãng lai</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-muted flex items-center justify-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Email</p>
                    <p className="text-gray-700 dark:text-gray-300 truncate">{message.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-muted flex items-center justify-center text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Số điện thoại</p>
                    <p className="text-gray-700 dark:text-gray-300">{message.phone || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-muted flex items-center justify-center text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Ngày gửi</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {sentAt ? new Date(sentAt).toLocaleString("vi-VN") : "---"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContactDetailPage;
