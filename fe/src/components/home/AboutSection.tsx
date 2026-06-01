import React from "react";
import ScrollReveal from "@/components/common/ScrollReveal";
import { Link } from "react-router-dom";
import { Award, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const AboutSection = () => {
  const { language } = useLocale();
  const copy =
    language === "en"
      ? {
          years: "Years crafting luxury stay experiences",
          eyebrow: "Our legacy",
          title: "Redefining",
          accent: "Luxury",
          desc: "At Luxury Stay Hotel, we do more than provide rooms. We create priceless moments through refined architecture and deeply personal service.",
          awardTitle: "International Awards",
          awardDesc: 'Honored as "Asia\'s Most Luxurious Hotel" for three consecutive years.',
          securityTitle: "Absolute privacy",
          securityDesc: "Optimized security and privacy for every premium guest.",
          link: "Discover our story",
        }
      : {
          years: "Năm kiến tạo trải nghiệm nghỉ dưỡng xa hoa",
          eyebrow: "Di sản của chúng tôi",
          title: "Định nghĩa lại",
          accent: "Sự sang trọng",
          desc: "Tại Luxury Stay Hotel, chúng tôi không chỉ cung cấp phòng nghỉ. Chúng tôi kiến tạo những khoảnh khắc vô giá, kết hợp giữa tinh hoa kiến trúc và dịch vụ cá nhân hóa đỉnh cao.",
          awardTitle: "Giải thưởng Quốc tế",
          awardDesc: 'Vinh dự nhận giải thưởng "Khách sạn sang trọng nhất châu Á" 3 năm liên tiếp.',
          securityTitle: "An toàn tuyệt đối",
          securityDesc: "Hệ thống bảo mật và riêng tư tối ưu cho mọi khách hàng thượng lưu.",
          link: "Tìm hiểu câu chuyện của chúng tôi",
        };

  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          
          {/* Left Side: Artistic Image Layout */}
          <ScrollReveal direction="left">
            <div className="relative">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2070" 
                  alt="Luxury Hotel" 
                  className="w-full h-[400px] md:h-[480px] object-cover transition-transform duration-1000 hover:scale-105"
                />
              </div>
              
              <div className="absolute bottom-8 -left-8 z-20 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl max-w-[220px] animate-float">
                <p className="text-gold font-black text-3xl mb-1">12+</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-tight">{copy.years}</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Side: Content */}
          <ScrollReveal direction="right">
            <div className="space-y-6 md:space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-[1px] bg-gold" />
                  <span className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">{copy.eyebrow}</span>
                </div>
                <h2 className="font-heading text-3xl md:text-5xl xl:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.95]">
                  {copy.title} <br />
                  <span className="text-gold italic">{copy.accent}</span>
                </h2>
                <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-xl">
                  {copy.desc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 italic text-sm uppercase tracking-tighter">{copy.awardTitle}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{copy.awardDesc}</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 italic text-sm uppercase tracking-tighter">{copy.securityTitle}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{copy.securityDesc}</p>
                </div>
              </div>

              <div className="pt-4">
                <Link 
                  to="/about" 
                  className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 border-b-2 border-slate-100 pb-1 hover:border-gold transition-all"
                >
                  {copy.link} 
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2 text-gold" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
