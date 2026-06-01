import { Sparkles } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import ScrollReveal from "@/components/common/ScrollReveal";

const PromotionsHero = () => {
  const { language } = useLocale();
  const copy =
    language === "en"
      ? {
          eyebrow: "Member exclusives",
          titleStart: "Exclusive",
          accent: "Deals",
          titleEnd: "Only at Luxury Stay",
          desc: "Discover our best getaway packages with exceptional value. We bring five-star experiences with smarter pricing.",
        }
      : {
          eyebrow: "Đặc quyền thành viên",
          titleStart: "Ưu Đãi",
          accent: "Độc Quyền",
          titleEnd: "Chỉ Có Tại Luxury Stay",
          desc: "Khám phá những gói nghỉ dưỡng tuyệt vời nhất với mức giá không thể rẻ hơn. Chúng tôi cam kết mang lại trải nghiệm 5 sao với chi phí tối ưu nhất.",
        };

  return (
    <section className="relative h-[60vh] min-h-[420px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=2070"
          alt="Luxury Stay Promotions"
          className="w-full h-full object-cover scale-105 animate-kenburns"
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/40 via-transparent to-navy-dark/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <ScrollReveal direction="up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/15 border border-gold/30 rounded-full text-gold text-xs font-bold uppercase mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            {copy.eyebrow}
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-white font-bold mb-6 leading-tight">
            {copy.titleStart} <span className="text-gold italic">{copy.accent}</span> <br />
            {copy.titleEnd}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {copy.desc}
          </p>
          <div className="gold-divider mx-auto" />
        </ScrollReveal>
      </div>
    </section>
  );
};

export default PromotionsHero;
