import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const EntryLoader = () => {
  const { language } = useLocale();
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const copy =
    language === "en"
      ? {
          tagline: "Preparing your",
          highlight: "perfect stay",
          suffix: "",
          initializing: "INITIALIZING LUXURY ENVIRONMENT",
        }
      : {
          tagline: "Đang chuẩn bị",
          highlight: "kỳ nghỉ tuyệt vời",
          suffix: "của bạn",
          initializing: "KHỞI TẠO KHÔNG GIAN LUXURY",
        };

  useEffect(() => {
    // Show loader only once per session
    const hasSeen = sessionStorage.getItem("app_entry_loader_seen");
    if (hasSeen) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("app_entry_loader_seen", "true");
      }, 800); // Wait for fade out animation
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#070708] selection:bg-gold/30 overflow-hidden transition-all duration-1000 ease-in-out ${isLeaving ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent animate-pulse" />
      
      <div className="flex flex-col items-center animate-in zoom-in-95 duration-1000 fill-mode-both relative z-10">
        {/* Luxury Orbit Spinner */}
        <div className="relative w-40 h-40 mb-12">
          {/* Main Orbit */}
          <div className="absolute inset-0 rounded-full border-2 border-gold/10 luxury-orbit">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-gold rounded-full shadow-[0_0_25px_rgba(212,175,55,1)]" />
          </div>
          
          {/* Inner Counter-Orbit */}
          <div className="absolute inset-6 rounded-full border border-gold/20 luxury-orbit [animation-direction:reverse] [animation-duration:5s]" />
          
          {/* Core Sparkle */}
          <div className="absolute inset-12 bg-gradient-to-tr from-gold to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.3)] luxury-pulse">
            <div className="w-16 h-16 bg-slate-950/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Sparkles className="w-8 h-8 text-slate-950" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-8 px-10 max-w-xl">
          <div className="space-y-3">
            <p className="text-gold text-[11px] uppercase tracking-[0.6em] font-black animate-in fade-in slide-in-from-bottom-2 duration-700">The Ultimate Experience</p>
            <h1 className="text-5xl md:text-6xl font-heading font-black text-white tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Luxury <span className="text-gold italic">Stay</span> Hotel
            </h1>
          </div>
          
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-700 fill-mode-both">
            <p className="text-slate-300 text-xl font-medium tracking-widest uppercase italic">
              {copy.tagline} <span className="text-gold">{copy.highlight}</span> {copy.suffix}
            </p>
            <div className="flex gap-1.5">
               <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce delay-0" />
               <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce delay-150" />
               <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce delay-300" />
            </div>
          </div>
        </div>

        {/* Cinematic Progress Bar */}
        <div className="mt-20 w-80 h-[2px] bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px] relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent animate-[progress_3s_ease-in-out_infinite] shadow-[0_0_15px_rgba(212,175,55,0.6)]"></div>
        </div>
        
        <p className="mt-10 text-[9px] uppercase tracking-[0.8em] font-black text-gold/20 animate-pulse">
          {copy.initializing}
        </p>
      </div>
    </div>
  );
};

export default EntryLoader;
