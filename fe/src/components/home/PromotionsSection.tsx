import React, { useState, useEffect } from "react";
import ScrollReveal from "@/components/common/ScrollReveal";
import { promotions } from "@/data/hotels";
import { Sparkles, Copy, Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";

const PromotionsSection = () => {
  const [activeIndex, setActiveIndex] = useState(1);
  const { language } = useLocale();
  const localizedPromotions =
    language === "en"
      ? promotions.map((promotion) => {
          const englishCopy: Record<string, Pick<typeof promotion, "title" | "description">> = {
            "promo-1": {
              title: "Radiant Summer Escape",
              description: "Special savings for summer stays at Vietnam's most refined beachfront resorts.",
            },
            "promo-2": {
              title: "Early Booking Value",
              description: "Book 30 days ahead to unlock up to 30% off every room category.",
            },
            "promo-3": {
              title: "Relaxing Weekend",
              description: "Enjoy a weekend package with breakfast and complimentary spa benefits.",
            },
          };

          return { ...promotion, ...(englishCopy[promotion.id] || {}) };
        })
      : promotions;
  const total = localizedPromotions.length;
  const copy =
    language === "en"
      ? {
          copied: "Copied code",
          eyebrow: "Limited offers",
          titleStart: "Member",
          titleAccent: "Privileges",
          memberCode: "Member code",
        }
      : {
          copied: "Đã sao chép mã",
          eyebrow: "Ưu đãi giới hạn",
          titleStart: "Đặc quyền",
          titleAccent: "Thành viên",
          memberCode: "Mã hội viên",
        };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [total]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${copy.copied}: ${code}`);
  };

  const getCardStyles = (index: number) => {
    const relIndex = (index - activeIndex + total) % total;
    
    // Smooth Circular Position Mapping
    if (relIndex === 0) {
      // Center
      return "z-30 scale-100 opacity-100 translate-x-0 rotate-0";
    } else if (relIndex === 1) {
      // Right (Next)
      return "z-10 scale-75 opacity-30 translate-x-[50%] lg:translate-x-[70%] rotate-y-[-15deg] blur-[2px]";
    } else {
      // Left (Prev)
      return "z-10 scale-75 opacity-30 translate-x-[-50%] lg:translate-x-[-70%] rotate-y-[15deg] blur-[2px]";
    }
  };

  return (
    <section className="h-full w-full bg-slate-950 relative overflow-hidden flex flex-col">
      {/* Dark Luxury Texture */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="flex-1 flex flex-col justify-center container mx-auto px-6 lg:px-12 max-w-[1500px] relative z-10 py-10">
        <ScrollReveal direction="blur">
          <div className="text-center mb-8 xl:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full mb-3">
               <Sparkles className="w-3 h-3 text-gold" />
               <span className="text-gold text-[9px] font-black uppercase tracking-[0.3em]">{copy.eyebrow}</span>
            </div>
            <h2 className="font-heading text-4xl md:text-5xl xl:text-5xl font-black text-white mb-3 tracking-tighter italic leading-tight">
              {copy.titleStart} <span className="text-gold">{copy.titleAccent}</span>
            </h2>
            <div className="gold-divider mx-auto scale-50" />
          </div>
        </ScrollReveal>

        <div className="relative h-[420px] md:h-[480px] flex items-center justify-center [perspective:2000px]">
          {/* Carousel Navigation */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-50 flex justify-between px-2 pointer-events-none">
            <button 
              onClick={() => setActiveIndex((prev) => (prev - 1 + total) % total)}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-gold hover:text-slate-950 transition-all pointer-events-auto active:scale-90 shadow-xl backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveIndex((prev) => (prev + 1) % total)}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-gold hover:text-slate-950 transition-all pointer-events-auto active:scale-90 shadow-xl backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Carousel Content Container */}
          <div className="relative w-full max-w-4xl h-full flex items-center justify-center py-4">
            {localizedPromotions.map((p, i) => {
              const styles = getCardStyles(i);
              const isActive = (i === activeIndex);

              return (
                <div 
                  key={p.id}
                  className={`absolute w-full md:w-[70%] h-[380px] md:h-[420px] rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${styles}`}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Background Image */}
                  <img 
                    src={p.image} 
                    alt={p.title} 
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] ${isActive ? 'scale-110' : 'scale-100'}`}
                  />
                  {/* Luxury Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent transition-opacity duration-1000 ${isActive ? 'opacity-85' : 'opacity-100'}`} />
                  
                  {/* Content (Centered & Responsive) */}
                  <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-end transition-all duration-1000 ${isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
                    <div className="mb-6 flex justify-between items-start">
                      <div className="bg-gold text-slate-950 text-[9px] font-black px-4 py-1.5 rounded-xl shadow-lg uppercase tracking-[0.2em] animate-pulse">
                        -{p.discount}% Exclusive
                      </div>
                      <div className="p-2 bg-white/5 rounded-xl backdrop-blur-md border border-white/10">
                        <Ticket className="w-6 h-6 text-gold" />
                      </div>
                    </div>
                    
                    <h3 className="font-heading text-3xl md:text-4xl text-white font-black mb-4 tracking-tight italic leading-none">
                      {p.title}
                    </h3>
                    
                    <p className="text-slate-300 text-sm md:text-base mb-8 line-clamp-2 font-medium leading-relaxed max-w-xl">
                      {p.description}
                    </p>
                    
                    <div className="flex items-center justify-between border-t border-white/10 pt-8">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gold/60 font-black uppercase tracking-[0.4em] mb-2">{copy.memberCode}</span>
                        <span className="text-white font-mono font-black text-2xl tracking-[0.3em] uppercase">{p.code}</span>
                      </div>
                      <button 
                        onClick={() => handleCopyCode(p.code)}
                        className="w-14 h-14 bg-gold text-slate-950 rounded-2xl hover:bg-white hover:scale-110 transition-all duration-500 active:scale-95 flex items-center justify-center shadow-xl shadow-gold/10 group"
                      >
                        <Copy className="w-6 h-6 transition-transform group-hover:rotate-12" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionsSection;
