import React, { useEffect, useMemo, useState } from 'react';
import { useLocale } from "@/contexts/LocaleContext";

const sections = [
  { id: 'section-hero', label: 'Trang Chủ' },
  { id: 'section-stats', label: 'Tổng Quan' },
  { id: 'section-hotels', label: 'Khách Sạn Nổi Bật' },
  { id: 'section-about', label: 'Về Chúng Tôi' },
  { id: 'section-promotions', label: 'Ưu Đãi Đặc Quyền' },
  { id: 'section-news', label: 'Tin Tức' },
  { id: 'section-partners', label: 'Giải Thưởng' }
];

export default function SectionNavigation() {
  const { language } = useLocale();
  const [activeId, setActiveId] = useState('section-hero');
  const localizedSections = useMemo(
    () =>
      language === "en"
        ? [
            { id: "section-hero", label: "Home" },
            { id: "section-stats", label: "Overview" },
            { id: "section-hotels", label: "Featured Hotels" },
            { id: "section-about", label: "About Us" },
            { id: "section-promotions", label: "Exclusive Deals" },
            { id: "section-news", label: "News" },
            { id: "section-partners", label: "Awards" },
          ]
        : sections,
    [language],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of the section is visible
    );

    localizedSections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [localizedSections]);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-5">
      {localizedSections.map(({ id, label }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="group relative flex items-center justify-end w-12 h-6 focus:outline-none cursor-pointer"
            aria-label={`Scroll to ${label}`}
          >
            {/* Hover Tooltip */}
            <span 
              className={`absolute right-10 px-3 py-1.5 bg-slate-900/90 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm whitespace-nowrap backdrop-blur-md transition-all duration-300 pointer-events-none shadow-xl
                ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}
              `}
            >
              {label}
            </span>
            
            {/* The Dot */}
            <div className="relative flex items-center justify-center w-6 h-6">
              {/* Active Glowing ring */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-700
                  ${isActive ? 'bg-gold/20 scale-150 blur-[2px]' : 'bg-transparent scale-50 opacity-0'}
                `} 
              />
              {/* Core Dot */}
              <div 
                className={`rounded-full transition-all duration-500 shadow-sm
                  ${isActive ? 'w-3 h-3 bg-gold scale-110 shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'w-2 h-2 bg-white/40 group-hover:bg-white/80 group-hover:scale-110'}
                `} 
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
