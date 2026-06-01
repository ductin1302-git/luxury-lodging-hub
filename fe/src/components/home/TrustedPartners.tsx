import React from "react";
import { Award, Trophy, Star, Crown, Medal, Gem } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const awards = [
  { icon: Trophy, name: 'Forbes Travel Guide', desc: "Giải Thưởng 5 Sao 2026", color: "text-yellow-400" },
  { icon: Crown, name: 'Condé Nast Traveler', desc: "Vinh Danh Gold List", color: "text-amber-300" },
  { icon: Award, name: 'Travel + Leisure', desc: "Khách Sạn Tốt Nhất Thế Giới", color: "text-orange-300" },
  { icon: Star, name: 'Michelin Guide', desc: "Đạt Chuẩn 3 Chìa Khóa", color: "text-red-400" },
  { icon: Medal, name: 'World Travel Awards', desc: "Khách Sạn Sang Trọng Hàng Đầu", color: "text-blue-300" },
  { icon: Gem, name: 'Boutique Hotel Awards', desc: "Thiết Kế Đẹp Nhất", color: "text-purple-300" }
];

export default function TrustedPartners() {
  const { language } = useLocale();
  const localizedAwards =
    language === "en"
      ? [
          { icon: Trophy, name: "Forbes Travel Guide", desc: "Five-Star Award 2026", color: "text-yellow-400" },
          { icon: Crown, name: "Condé Nast Traveler", desc: "Gold List Honoree", color: "text-amber-300" },
          { icon: Award, name: "Travel + Leisure", desc: "World's Best Hotel", color: "text-orange-300" },
          { icon: Star, name: "Michelin Guide", desc: "Three-Key Standard", color: "text-red-400" },
          { icon: Medal, name: "World Travel Awards", desc: "Leading Luxury Hotel", color: "text-blue-300" },
          { icon: Gem, name: "Boutique Hotel Awards", desc: "Best Design", color: "text-purple-300" },
        ]
      : awards;
  const copy =
    language === "en"
      ? {
          imageAlt: "Luxury resort hotel",
          eyebrow: "Global recognition",
          titleA: "World",
          titleB: "Class",
          desc: "Our commitment to exceptional luxury, flawless service and architectural beauty has been recognized by the world's most respected travel and lifestyle organizations.",
          button: "View all awards",
        }
      : {
          imageAlt: "Khách sạn nghỉ dưỡng sang trọng",
          eyebrow: "Sự Công Nhận Toàn Cầu",
          titleA: "Đẳng Cấp",
          titleB: "Thế Giới",
          desc: "Cam kết kiên định của chúng tôi đối với sự sang trọng bậc nhất, dịch vụ hoàn hảo và kiến trúc tuyệt mỹ đã được vinh danh bởi những tổ chức du lịch và phong cách sống danh giá nhất toàn cầu.",
          button: "Xem Tất Cả Giải Thưởng",
        };

  return (
    <section className="relative w-full h-screen py-24 lg:py-32 overflow-hidden bg-slate-950 flex flex-col justify-center">
      {/* High-End Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80" 
          alt={copy.imageAlt}
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        {/* Complex Gradients for readability and mood */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-900/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
      </div>

      {/* Abstract Glowing Elements for the luxury feel */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-gold/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="container mx-auto px-6 relative z-10 flex flex-col xl:flex-row items-center gap-16 lg:gap-24">
        
        {/* Left Text Column */}
        <div 
          className="w-full xl:w-5/12 text-center xl:text-left"
          style={{ animation: 'fade-in-up 1s ease-out forwards' }}
        >
          <div className="inline-flex items-center space-x-4 mb-6">
            <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-gold xl:hidden"></span>
            <span className="text-gold text-[11px] md:text-xs uppercase tracking-[0.4em] font-black">{copy.eyebrow}</span>
            <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-gold xl:hidden"></span>
            <span className="hidden xl:block w-24 h-[1px] bg-gradient-to-r from-gold/50 to-transparent"></span>
          </div>
          
          <h3 className="font-heading text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none mb-6">
            {copy.titleA.toUpperCase()} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold italic">{copy.titleB.toUpperCase()}</span>
          </h3>
          
          <p className="text-white/60 text-sm md:text-base lg:text-lg tracking-wide font-light leading-relaxed mb-10 xl:border-l-2 border-gold/30 xl:pl-5 max-w-2xl mx-auto xl:mx-0">
            {copy.desc}
          </p>
          
          <button className="px-8 py-4 bg-white/[0.03] border border-white/10 hover:border-gold/50 hover:bg-gold/10 text-white rounded-none transition-all duration-500 tracking-widest text-xs uppercase font-bold group inline-flex items-center gap-4 backdrop-blur-md">
            {copy.button}
            <span className="w-8 h-[1px] bg-gold group-hover:w-16 transition-all duration-500"></span>
          </button>
        </div>
        
        {/* Right Grid Column with Glassmorphic Award Cards */}
        <div 
          className="w-full xl:w-7/12"
          style={{ animation: 'fade-in-up 1s ease-out 0.2s forwards', opacity: 0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localizedAwards.map((award, i) => (
              <div 
                key={i} 
                className="group relative flex items-center gap-5 p-5 bg-slate-900/40 border border-white/[0.05] backdrop-blur-xl hover:bg-slate-800/60 hover:border-gold/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.05)] transition-all duration-500 overflow-hidden"
              >
                {/* Hover Gradient Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon Container with subtle glow */}
                <div className={`w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/10 group-hover:border-gold/30 group-hover:bg-gold/5 transition-all duration-500 shrink-0 shadow-lg ${award.color} relative z-10`}>
                  <award.icon strokeWidth={1.5} className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                {/* Text Content */}
                <div className="flex flex-col relative z-10">
                  <span className="text-white font-bold text-base md:text-lg mb-1 group-hover:text-gold transition-colors duration-300 tracking-tight">{award.name}</span>
                  <span className="text-white/40 text-[10px] md:text-xs uppercase tracking-widest font-semibold group-hover:text-white/70 transition-colors duration-300">{award.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      {/* Inline Keyframes for native animation if not in CSS */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
