import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HomeHero from "@/components/home/HomeHero";
import FeaturedHotels from "@/components/home/FeaturedHotels";
import AboutSection from "@/components/home/AboutSection";
import PromotionsSection from "@/components/home/PromotionsSection";
import HomeNews from "@/components/home/HomeNews";
import TrustedPartners from "@/components/home/TrustedPartners";
import SectionNavigation from "@/components/home/SectionNavigation";
import ScrollReveal from "@/components/common/ScrollReveal";
import { useCountUp } from "@/hooks/useScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";

const StatCounter = ({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) => {
  const { count, ref } = useCountUp(target, 2200);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-5xl font-black text-gold mb-2 tracking-tighter">{count.toLocaleString()}{suffix}</p>
      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">{label}</p>
    </div>
  );
};

const Index = () => {
  const { language } = useLocale();
  const statsCopy =
    language === "en"
      ? ["Partner hotels", "Happy guests", "Provinces", "Satisfaction rate"]
      : ["Khách sạn đối tác", "Khách hàng hài lòng", "Tỉnh thành", "Tỷ lệ hài lòng"];

  React.useEffect(() => {
    const container = document.querySelector('.snap-container') as HTMLElement;
    if (!container) return;

    let isAnimating = false;
    let animTimeout: NodeJS.Timeout;
    let rafId: number;

    // Lấy tất cả các trang (sections) bao gồm cả footer (đều có class snap-section)
    const getSections = () => Array.from(container.querySelectorAll('.snap-section')) as HTMLElement[];

    // Thuật toán cuộn mượt cao cấp (Ease Out Quartic) bằng requestAnimationFrame tự động hủy khung hình cũ để tránh giật hình
    const smoothScrollTo = (targetTop: number, duration: number = 420) => {
      cancelAnimationFrame(rafId);
      const startTop = container.scrollTop;
      const change = targetTop - startTop;
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // Ease Out Quartic: bắt đầu tăng tốc tức thì cực nhanh và hãm phanh êm ái về cuối
        const ease = 1 - Math.pow(1 - progress, 4);

        container.scrollTop = startTop + change * ease;

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        }
      };

      rafId = requestAnimationFrame(animate);
    };

    const handleWheel = (e: WheelEvent) => {
      // Chỉ can thiệp vào cuộn chuột khi không có phím modifier (tránh lỗi zoom)
      if (e.ctrlKey || e.metaKey) return;
      
      e.preventDefault(); // Chặn cuộn mặc định để bảo vệ snap chính xác

      if (isAnimating) return;

      // Bỏ qua các chuyển động lăn cực nhỏ (như độ trôi nhẹ của trackpad)
      if (Math.abs(e.deltaY) < 18) return;

      const sections = getSections();
      if (!sections.length) return;

      let currentIndex = 0;
      let minDiff = Infinity;
      
      // Sử dụng getBoundingClientRect() cho độ chính xác tuyệt đối không phụ thuộc offsetParent
      sections.forEach((sec, idx) => {
        const rect = sec.getBoundingClientRect();
        const diff = Math.abs(rect.top);
        if (diff < minDiff) {
          minDiff = diff;
          currentIndex = idx;
        }
      });

      // Xác định chiều cuộn: -1 (lên) hoặc +1 (xuống)
      const direction = e.deltaY > 0 ? 1 : -1;
      let nextIndex = currentIndex + direction;
      
      // Giới hạn không vượt quá đầu/cuối trang
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= sections.length) nextIndex = sections.length - 1;

      if (nextIndex !== currentIndex) {
        isAnimating = true;
        
        // Cuộn bằng hàm custom trơn tru siêu việt không có độ trễ khởi động
        smoothScrollTo(sections[nextIndex].offsetTop, 420);
        
        // Khóa cuộn ngắn hợp lý (450ms) để có thể lăn liên tục cuốn chiếu cực nhạy
        clearTimeout(animTimeout);
        animTimeout = setTimeout(() => {
          isAnimating = false;
        }, 450);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(animTimeout);
    };
  }, []);

  return (
    <div className="bg-background selection:bg-gold/30 h-screen overflow-hidden">
      <Header />

      <div className="snap-container">
        <SectionNavigation />
        
        {/* 0. HERO SECTION */}
        <section id="section-hero" className="snap-section bg-slate-950">
          <HomeHero />
        </section>

        {/* STATS SECTION */}
        <section id="section-stats" className="snap-section bg-slate-950">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="container mx-auto px-4 relative z-10 pt-20">
            <ScrollReveal direction="up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                <StatCounter target={1500} label={statsCopy[0]} suffix="+" />
                <StatCounter target={50000} label={statsCopy[1]} suffix="+" />
                <StatCounter target={63} label={statsCopy[2]} />
                <StatCounter target={98} label={statsCopy[3]} suffix="%" />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 1. FEATURED HOTELS */}
        <div id="section-hotels" className="snap-section bg-white pt-16">
          <FeaturedHotels />
        </div>

        {/* 2. ABOUT US */}
        <div id="section-about" className="snap-section bg-white pt-16">
          <AboutSection />
        </div>

        {/* 3. PROMOTIONS */}
        <div id="section-promotions" className="snap-section bg-slate-950 pt-16">
          <PromotionsSection />
        </div>

        {/* 4. NEWS & MAGAZINE */}
        <div id="section-news" className="snap-section bg-[#f8fafc] dark:bg-slate-900/50 pt-16">
          <HomeNews />
        </div>

        {/* 5. TRUSTED BY */}
        <div id="section-partners" className="snap-section">
          <TrustedPartners />
        </div>

        {/* 6. FOOTER */}
        <div className="bg-slate-950 w-full snap-section" style={{ scrollSnapAlign: 'end' }}>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Index;
