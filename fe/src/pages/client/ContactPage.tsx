import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarClock,
  Facebook,
  Headphones,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";

import ScrollReveal from "@/components/common/ScrollReveal";
import ContactHero from "@/components/home/ContactHero";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { apiFetch } from "@/services/apiClient";

const contactChannels = [
  {
    icon: Phone,
    title: "Tổng đài đặt phòng",
    detail: "+84 (028) 3888 9999",
    note: "Hỗ trợ tư vấn phòng, báo giá và thay đổi đặt chỗ.",
  },
  {
    icon: Mail,
    title: "Email chăm sóc khách hàng",
    detail: "contact@luxurystay.com",
    note: "Phù hợp cho yêu cầu chi tiết, xác nhận và hợp đồng.",
  },
  {
    icon: MapPin,
    title: "Trung tâm tiếp đón",
    detail: "88 Luxury Way, Quận 1, TP. Hồ Chí Minh",
    note: "Đón tiếp khách doanh nghiệp, đối tác và khách đoàn.",
  },
];

const supportHighlights = [
  {
    icon: Headphones,
    title: "Đội ngũ chuyên trách",
    description: "Mỗi yêu cầu được theo dõi xuyên suốt từ lúc tiếp nhận đến khi hoàn tất lưu trú.",
  },
  {
    icon: CalendarClock,
    title: "Xử lý nhanh",
    description: "Các yêu cầu phổ biến như báo giá, kiểm tra phòng và thời gian nhận phòng được phản hồi sớm trong ngày.",
  },
  {
    icon: ShieldCheck,
    title: "Thông tin rõ ràng",
    description: "Mọi xác nhận về giá, điều kiện cọc và dịch vụ đi kèm đều được trình bày minh bạch.",
  },
];

const socialLinks = [
  { icon: Facebook, label: "Facebook" },
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter" },
];

const ContactPage = () => {
  const { user } = useAuth();
  const { language } = useLocale();
  const copy =
    language === "en"
      ? {
          defaultSubject: "Booking & Rates",
          sent: "Your message has been sent successfully. We will respond as soon as possible.",
          failed: "Something went wrong while sending your message. Please try again later.",
          panelTitle: "Choose the right contact channel and we will handle it faster.",
          panelDesc: "Luxury Stay supports individual requests, family reservations, business travelers and long-stay groups.",
          social: "Social",
          requestEyebrow: "Send request",
          requestTitle: "Talk with the Luxury Stay team",
          requestDesc: "Share concise details about your needs and stay dates so we can respond accurately the first time.",
          responseTime: "Priority response time: 08:00 - 22:00",
          fullName: "Full name",
          subject: "Subject",
          message: "Message",
          messagePlaceholder: "Example: I need a quote for 3 family rooms from the 15th to the 17th, preferably close together with breakfast included.",
          send: "Send request",
          groupHint: "For corporate or group bookings, include the number of guests so we can quote more accurately.",
          commitment: "Service commitment",
          commitmentTitle: "Clear, fast and aligned with your stay needs",
          visit: "Visit Luxury Stay",
          visitTitle: "Meet our team directly at the guest reception center.",
          address: "Address",
          addressDetail: "88 Luxury Way, District 1, Ho Chi Minh City",
          supportHours: "Support hours",
          supportHoursDetail: "Daily from 08:00 to 22:00 for direct consultation, corporate requests and group stays.",
          priority: "Priority support",
          priorityDesc: "For urgent booking confirmation, special check-in requests or group stay planning, call us directly so we can prioritize your case.",
          directEmail: "Direct email",
          directions: "View directions",
          subjects: ["Booking & Rates", "Dining services", "Event planning", "Service feedback"],
        }
      : {
          defaultSubject: "Đặt phòng & Giá",
          sent: "Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất.",
          failed: "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.",
          panelTitle: "Chọn đúng kênh liên hệ và chúng tôi sẽ xử lý nhanh hơn.",
          panelDesc: "Luxury Stay tiếp nhận cả yêu cầu cá nhân, đặt phòng gia đình, khách doanh nghiệp và đoàn lưu trú dài ngày.",
          social: "Mạng xã hội",
          requestEyebrow: "Gửi yêu cầu",
          requestTitle: "Trao đổi với đội ngũ Luxury Stay",
          requestDesc: "Điền thông tin ngắn gọn, rõ nhu cầu và thời gian lưu trú. Điều đó giúp chúng tôi phản hồi sát hơn ngay lần đầu.",
          responseTime: "Thời gian phản hồi ưu tiên: 08:00 - 22:00",
          fullName: "Họ và tên",
          subject: "Chủ đề",
          message: "Tin nhắn",
          messagePlaceholder: "Ví dụ: Tôi cần báo giá 3 phòng cho gia đình từ ngày 15 đến 17, ưu tiên phòng gần nhau và có ăn sáng.",
          send: "Gửi yêu cầu",
          groupHint: "Đối với đặt phòng doanh nghiệp hoặc khách đoàn, bạn có thể ghi rõ số lượng khách để chúng tôi báo giá chính xác hơn.",
          commitment: "Cam kết dịch vụ",
          commitmentTitle: "Làm việc rõ ràng, nhanh và đúng nhu cầu lưu trú",
          visit: "Visit Luxury Stay",
          visitTitle: "Gặp trực tiếp đội ngũ chúng tôi tại trung tâm tiếp đón khách hàng.",
          address: "Địa chỉ",
          addressDetail: "88 Luxury Way, Quận 1, TP. Hồ Chí Minh",
          supportHours: "Khung giờ hỗ trợ",
          supportHoursDetail: "Mỗi ngày từ 08:00 đến 22:00 cho tư vấn trực tiếp, tiếp nhận yêu cầu doanh nghiệp và khách đoàn.",
          priority: "Hỗ trợ ưu tiên",
          priorityDesc: "Nếu bạn cần chốt nhanh đặt phòng, yêu cầu check-in đặc biệt hoặc kế hoạch lưu trú cho nhóm khách, hãy gọi trực tiếp để chúng tôi ưu tiên xử lý.",
          directEmail: "Email trực tiếp",
          directions: "Xem chỉ dẫn di chuyển",
          subjects: ["Đặt phòng & Giá", "Dịch vụ ăn uống", "Tổ chức sự kiện", "Góp ý dịch vụ"],
        };
  const contactChannels =
    language === "en"
      ? [
          { icon: Phone, title: "Booking hotline", detail: "+84 (028) 3888 9999", note: "Room consultation, quotes and reservation changes." },
          { icon: Mail, title: "Guest care email", detail: "contact@luxurystay.com", note: "Best for detailed requests, confirmations and contracts." },
          { icon: MapPin, title: "Reception center", detail: "88 Luxury Way, District 1, Ho Chi Minh City", note: "Welcoming business travelers, partners and groups." },
        ]
      : [
          { icon: Phone, title: "Tổng đài đặt phòng", detail: "+84 (028) 3888 9999", note: "Hỗ trợ tư vấn phòng, báo giá và thay đổi đặt chỗ." },
          { icon: Mail, title: "Email chăm sóc khách hàng", detail: "contact@luxurystay.com", note: "Phù hợp cho yêu cầu chi tiết, xác nhận và hợp đồng." },
          { icon: MapPin, title: "Trung tâm tiếp đón", detail: "88 Luxury Way, Quận 1, TP. Hồ Chí Minh", note: "Đón tiếp khách doanh nghiệp, đối tác và khách đoàn." },
        ];
  const supportHighlights =
    language === "en"
      ? [
          { icon: Headphones, title: "Dedicated team", description: "Every request is tracked from first contact through the end of your stay." },
          { icon: CalendarClock, title: "Fast handling", description: "Common requests such as quotes, room checks and check-in timing are answered early in the day." },
          { icon: ShieldCheck, title: "Clear information", description: "Pricing, deposit terms and included services are communicated transparently." },
        ]
      : [
          { icon: Headphones, title: "Đội ngũ chuyên trách", description: "Mỗi yêu cầu được theo dõi xuyên suốt từ lúc tiếp nhận đến khi hoàn tất lưu trú." },
          { icon: CalendarClock, title: "Xử lý nhanh", description: "Các yêu cầu phổ biến như báo giá, kiểm tra phòng và thời gian nhận phòng được phản hồi sớm trong ngày." },
          { icon: ShieldCheck, title: "Thông tin rõ ràng", description: "Mọi xác nhận về giá, điều kiện cọc và dịch vụ đi kèm đều được trình bày minh bạch." },
        ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: copy.defaultSubject,
    message: "",
  });

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      subject: copy.subjects.includes(prev.subject) ? prev.subject : copy.defaultSubject,
    }));
  }, [language]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await apiFetch("/contacts", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          phone: user?.phone || undefined,
        }),
      });

      toast.success(copy.sent);
      setFormData({
        name: "",
        email: user?.email || "",
        subject: copy.defaultSubject,
        message: "",
      });
    } catch (error: any) {
      toast.error(error?.message || copy.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f1ea]">
      <Header />
      <ContactHero />

      <section className="pb-20 pt-14">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <ScrollReveal direction="left">
            <div className="rounded-[2rem] bg-gradient-navy px-7 py-8 text-white shadow-[0_28px_65px_-36px_rgba(2,6,23,0.78)]">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                <Sparkles className="h-3.5 w-3.5" /> Guest Relations
              </span>

              <h2 className="font-heading text-3xl font-bold leading-tight">
                {copy.panelTitle}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
                {copy.panelDesc}
              </p>

              <div className="mt-8 space-y-5">
                {contactChannels.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-gold">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-white">{item.title}</h3>
                          <p className="mt-1 text-sm font-medium text-gold-light">{item.detail}</p>
                          <p className="mt-2 text-sm leading-6 text-white/68">{item.note}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">{copy.social}</p>
                <div className="mt-4 flex gap-3">
                  {socialLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/72 transition-colors hover:border-gold/40 hover:text-gold"
                        aria-label={item.label}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="rounded-[2rem] border border-slate-100 bg-white px-7 py-8 shadow-[0_28px_60px_-40px_rgba(15,23,42,0.3)] md:px-9">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{copy.requestEyebrow}</span>
                  <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900">{copy.requestTitle}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                    {copy.requestDesc}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {copy.responseTime}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900">{copy.fullName}</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900">Email</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      placeholder="example@gmail.com"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">{copy.subject}</label>
                  <select
                    value={formData.subject}
                    onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/10"
                  >
                    {copy.subjects.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">{copy.message}</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    placeholder={copy.messagePlaceholder}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/10"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    disabled={isSubmitting}
                    className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-gradient-gold px-8 py-4 text-sm font-semibold text-primary shadow-[0_18px_30px_-18px_rgba(212,175,55,0.8)] transition-all hover:opacity-90"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    ) : (
                      <>
                        {copy.send} <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-sm leading-6 text-slate-500">
                    {copy.groupHint}
                  </p>
                </div>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{copy.commitment}</span>
              <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900">{copy.commitmentTitle}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {supportHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <ScrollReveal key={item.title} direction="up">
                  <div className="h-full rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.28)]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{item.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-white/10 bg-gradient-navy py-16 text-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <ScrollReveal direction="left">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">{copy.visit}</span>
              <h2 className="mt-4 font-heading text-3xl font-bold leading-tight md:text-4xl">
                {copy.visitTitle}
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur-md">
                  <p className="text-sm font-semibold text-white">{copy.address}</p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    {copy.addressDetail}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur-md">
                  <p className="text-sm font-semibold text-white">{copy.supportHours}</p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    {copy.supportHoursDetail}
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="flex h-full flex-col justify-between rounded-[2rem] border border-white/10 bg-white/6 p-7 backdrop-blur-md">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">{copy.priority}</p>
                <p className="mt-4 text-base leading-8 text-white/72">
                  {copy.priorityDesc}
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-[1.5rem] border border-white/10 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">Hotline</p>
                  <p className="mt-2 text-2xl font-bold text-gold-light">1900 1234</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">{copy.directEmail}</p>
                  <p className="mt-2 text-base font-semibold text-white">vip@luxurystay.vn</p>
                </div>
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-light">
                  {copy.directions} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
