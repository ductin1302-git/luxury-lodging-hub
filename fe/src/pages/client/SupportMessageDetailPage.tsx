import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Mail, MessageSquareMore, Phone } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { apiFetch } from "@/services/apiClient";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLocale } from "@/contexts/LocaleContext";

interface SupportMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  replyMessage?: string | null;
  createdAt: string;
  repliedAt?: string | null;
}

const SupportMessageDetailPage = () => {
  const { id } = useParams();
  const { markAsRead } = useNotifications();
  const { language } = useLocale();
  const [message, setMessage] = useState<SupportMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const copy =
    language === "en"
      ? {
          back: "Back to notifications",
          loading: "Loading support response...",
          error: "Could not load the support response",
          eyebrow: "Support Response",
          intro: "This is the full history of your request and the reply from the Luxury Stay team.",
          phone: "Phone number",
          notUpdated: "Not updated",
          status: "Status",
          sentRequest: "Your submitted request",
          replyTitle: "Reply from Luxury Stay",
          waiting: "Waiting for response",
          fallbackReply: "Your request has been received. We will respond with details as soon as possible.",
          notFoundTitle: "Support request not found",
          notFoundDesc: "This contact request does not exist or does not belong to your account.",
          statusLabels: { replied: "Replied", read: "Read", new: "New" },
        }
      : {
          back: "Quay lại thông báo",
          loading: "Đang tải nội dung phản hồi...",
          error: "Không thể tải nội dung phản hồi",
          eyebrow: "Phản hồi hỗ trợ",
          intro: "Đây là toàn bộ lịch sử yêu cầu bạn đã gửi và phần phản hồi từ đội ngũ Luxury Stay.",
          phone: "Số điện thoại",
          notUpdated: "Chưa cập nhật",
          status: "Trạng thái",
          sentRequest: "Yêu cầu bạn đã gửi",
          replyTitle: "Phản hồi từ Luxury Stay",
          waiting: "Đang chờ phản hồi",
          fallbackReply: "Yêu cầu của bạn đã được tiếp nhận. Chúng tôi sẽ phản hồi chi tiết trong thời gian sớm nhất.",
          notFoundTitle: "Không tìm thấy yêu cầu hỗ trợ",
          notFoundDesc: "Liên hệ này không tồn tại hoặc không thuộc tài khoản của bạn.",
          statusLabels: { replied: "Đã phản hồi", read: "Đã đọc", new: "Mới" },
        };
  const dateLocale = language === "en" ? "en-US" : "vi-VN";

  useEffect(() => {
    const fetchMessage = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await apiFetch(`/contacts/my/${id}`);
        setMessage(data);
        markAsRead(`contact-reply:${id}`);
      } catch (error: any) {
        toast.error(error?.message || copy.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessage();
  }, [copy.error, id, markAsRead]);

  return (
    <div className="min-h-screen bg-[#f5f1ea]">
      <Header />

      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> {copy.back}
        </Link>

        {isLoading ? (
          <div className="mt-10 rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
            {copy.loading}
          </div>
        ) : message ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">{copy.eyebrow}</span>
              <h1 className="mt-3 font-heading text-3xl font-bold text-slate-900">{message.subject}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                {copy.intro}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] bg-slate-50 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Mail className="h-4 w-4 text-gold" /> Email
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{message.email}</p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Phone className="h-4 w-4 text-gold" /> {copy.phone}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{message.phone || copy.notUpdated}</p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CalendarClock className="h-4 w-4 text-gold" /> {copy.status}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {copy.statusLabels[message.status]}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <MessageSquareMore className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-slate-900">{copy.sentRequest}</h2>
                  <p className="text-sm text-slate-500">
                    {new Date(message.createdAt).toLocaleString(dateLocale)}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-6 text-sm leading-7 text-slate-600">
                {message.message}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <MessageSquareMore className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-slate-900">{copy.replyTitle}</h2>
                  <p className="text-sm text-slate-500">
                    {message.repliedAt ? new Date(message.repliedAt).toLocaleString(dateLocale) : copy.waiting}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-6 text-sm leading-7 text-slate-700">
                {message.replyMessage?.trim() || copy.fallbackReply}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">{copy.notFoundTitle}</p>
            <p className="mt-2 text-sm text-slate-500">{copy.notFoundDesc}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SupportMessageDetailPage;
