import { Clock3, MapPin, Phone } from "lucide-react";

import ScrollReveal from "@/components/common/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";

const ContactHero = () => {
  const { language } = useLocale();
  const quickFacts =
    language === "en"
      ? [
          { icon: Phone, title: "24/7 hotline", detail: "+84 (028) 3888 9999" },
          { icon: Clock3, title: "Fast response", detail: "Within 15 - 30 minutes" },
          { icon: MapPin, title: "In-person reception", detail: "District 1, Ho Chi Minh City" },
        ]
      : [
          { icon: Phone, title: "Hotline 24/7", detail: "+84 (028) 3888 9999" },
          { icon: Clock3, title: "Phản hồi nhanh", detail: "Trong 15 - 30 phút" },
          { icon: MapPin, title: "Đón tiếp trực tiếp", detail: "Quận 1, TP. Hồ Chí Minh" },
        ];
  const copy =
    language === "en"
      ? {
          eyebrow: "Contact Luxury Stay",
          title: "We are ready to help with bookings and tailored stay requests.",
          desc: "From vacation planning and group quotes to premium service requests, the Luxury Stay team supports you with fast response and a consistent experience.",
        }
      : {
          eyebrow: "Liên hệ Luxury Stay",
          title: "Chúng tôi sẵn sàng hỗ trợ bạn từ đặt phòng đến yêu cầu lưu trú riêng.",
          desc: "Từ tư vấn kỳ nghỉ, báo giá đoàn khách đến các yêu cầu dịch vụ cao cấp, đội ngũ Luxury Stay sẽ đồng hành cùng bạn với tốc độ phản hồi nhanh và trải nghiệm nhất quán.",
        };

  return (
    <section className="relative overflow-hidden min-h-[520px] flex items-end">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2070"
          alt="Luxury Stay Contact"
          className="w-full h-full object-cover scale-105 animate-kenburns"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-navy-dark/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-36">
        <ScrollReveal direction="up">
          <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-3xl">
              <span className="mb-4 inline-block px-4 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-md border border-gold/30">
                {copy.eyebrow}
              </span>
              <h1 className="font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
                {copy.desc}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {quickFacts.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[1.75rem] border border-white/15 bg-white/8 px-5 py-4 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/16 text-gold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-white/68">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ContactHero;
