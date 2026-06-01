import React from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/common/ScrollReveal";
import { Newspaper, Calendar, ArrowUpRight, Clock } from "lucide-react";
import { getPublishedNewsArticles, localizeNewsArticles } from "@/services/newsStore";
import { useLocale } from "@/contexts/LocaleContext";
import { getImageUrl } from "@/services/apiClient";

const HomeNews = () => {
  const { language } = useLocale();
  const displayNews = localizeNewsArticles(getPublishedNewsArticles(), language).slice(0, 4);
  const copy =
    language === "en"
      ? { eyebrow: "Luxury Magazine", title: "NEWS", accent: "CENTER", detail: "View details" }
      : { eyebrow: "Tạp chí Luxury", title: "TRUNG TÂM", accent: "TIN TỨC", detail: "Xem chi tiết" };

  return (
    <section className="h-full w-full bg-white dark:bg-slate-950 overflow-hidden flex items-center py-12">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] relative">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-12 xl:mb-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-[1px] bg-gold" />
                <span className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">{copy.eyebrow}</span>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                {copy.title} <span className="text-gold">{copy.accent}</span>
              </h2>
            </div>
            <Link to="/news" className="group w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 transition-all">
               <ArrowUpRight className="w-5 h-5 transition-transform group-hover:scale-110" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
          {displayNews.map((n, i) => (
            <ScrollReveal 
              key={n.id} 
              delay={(i % 2 + 1) as any} 
              direction={i % 2 === 0 ? "left" : "right"}
            >
              <div className="group flex flex-col sm:flex-row gap-6 items-stretch h-full bg-[#fcfbfa] dark:bg-[#122240]/20 border border-slate-100 dark:border-white/[0.04] p-5 rounded-[2rem] hover:bg-white dark:hover:bg-[#122240]/40 hover:shadow-luxury hover:border-gold/30 transition-all duration-500 hover:-translate-y-1">
                {/* Image Section */}
                <div className="w-full sm:w-44 xl:w-48 aspect-square rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                  <img 
                    src={getImageUrl(n.image)} 
                    alt={n.title} 
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                  />
                </div>
 
                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <span className="text-gold text-[9px] font-black uppercase tracking-[0.3em] mb-2 block">
                      {n.category}
                    </span>
                    <h3 className="font-heading text-base xl:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-gold transition-colors line-clamp-2">
                      {n.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2 font-medium">
                      {n.description}
                    </p>
                  </div>
                  <Link 
                    to={`/news/${n.id}`} 
                    className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white hover:text-gold transition-all group/link mt-4"
                  >
                    {copy.detail} <div className="w-6 h-[1px] bg-slate-300 dark:bg-white/20 group-hover/link:w-10 group-hover/link:bg-gold transition-all" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Decorative Pagination Dots (Like Reference) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3">
          {[1, 2, 3, 4].map((dot, i) => (
             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === 2 ? 'bg-red-500 scale-150 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-200 dark:bg-white/10'}`} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeNews;
