import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import { useLocale } from "@/contexts/LocaleContext";

const heroBanners = [
  {
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=100&w=2560",
    title: "Trải nghiệm nghỉ dưỡng đẳng cấp",
    subtitle: "Khám phá hàng nghìn khách sạn & resort sang trọng trên khắp Việt Nam"
  },
  {
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=100&w=2560",
    title: "Tuyệt phẩm nghỉ dưỡng ven biển",
    subtitle: "Tận hưởng không gian mở và tiếng sóng vỗ rì rào tại các resort hàng đầu"
  },
  {
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=100&w=2560",
    title: "Khám phá vẻ đẹp kỳ vĩ",
    subtitle: "Hành trình tìm về thiên nhiên tại những điểm đến thơ mộng nhất"
  },
  {
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=100&w=2560",
    title: "Sang trọng trong từng khoảnh khắc",
    subtitle: "Dịch vụ đẳng cấp thế giới chờ đón bạn tại mọi điểm dừng chân"
  },
  {
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=100&w=2560",
    title: "Ký ức ngọt ngào",
    subtitle: "Nơi tình yêu thăng hoa và những kỷ niệm gia đình bền chặt"
  }
];

const HomeHero = () => {
  const { language } = useLocale();
  const [currentBanner, setCurrentBanner] = useState(0);
  const localizedBanners =
    language === "en"
      ? heroBanners.map((banner, index) => ({
          ...banner,
          title: [
            "World-class luxury stays",
            "Seaside resort masterpieces",
            "Discover remarkable destinations",
            "Luxury in every moment",
            "Sweet memories, beautifully made",
          ][index],
          subtitle: [
            "Explore thousands of premium hotels and resorts across Vietnam",
            "Enjoy open-air spaces and the sound of waves at leading resorts",
            "A journey into nature at Vietnam's most poetic destinations",
            "World-class service awaits you at every stop",
            "Where romance and family moments become lasting memories",
          ][index],
        }))
      : heroBanners;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % localizedBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [localizedBanners.length]);

  return (
    <section className="relative h-full w-full overflow-hidden">
      {localizedBanners.map((banner, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentBanner ? "opacity-100 scale-100" : "opacity-0 scale-110"
            }`}
        >
          <img
            src={banner.image}
            alt={banner.title}
            className={`absolute inset-0 w-full h-full object-cover ${index === currentBanner ? "animate-ken-burns" : ""}`}
          />
          {/* Professional Vignette Depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/70 via-navy/30 to-navy-dark/90" />
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)]" />

          <div className="relative z-10 h-full flex flex-col items-center justify-center container mx-auto px-4 text-center pb-24">
            <div className="space-y-4 max-w-4xl">
               <h1 className={`font-heading text-5xl md:text-7xl text-primary-foreground font-black mb-4 transition-all duration-1000 tracking-tighter italic ${index === currentBanner ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`} style={{ transitionDelay: "0.2s" }}>
                {banner.title}
              </h1>
              <p className={`text-xl md:text-2xl text-primary-foreground/90 font-medium transition-all duration-1000 ${index === currentBanner ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`} style={{ transitionDelay: "0.4s" }}>
                {banner.subtitle}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {localizedBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBanner(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentBanner ? "bg-gold w-8" : "bg-white/40"
              }`}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full z-30 -translate-y-1/2">
        <div className="container mx-auto px-4">
          <SearchBar />
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
