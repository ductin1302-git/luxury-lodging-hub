import ScrollReveal from "@/components/common/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";

const AboutHero = () => {
  const { language } = useLocale();
  const copy =
    language === "en"
      ? {
          eyebrow: "About Us",
          title: "The Art of",
          accent: "Luxury",
          desc: "Luxury Stay Hotel delivers a world-class stay experience, where every detail is carefully shaped to create priceless memories.",
        }
      : {
          eyebrow: "Về Chúng Tôi",
          title: "Nghệ Thuật Của Sự",
          accent: "Sang Trọng",
          desc: "Luxury Stay Hotel mang đến trải nghiệm lưu trú đẳng cấp thế giới, nơi mỗi chi tiết đều được chăm chút tỉ mỉ để tạo nên những kỷ niệm vô giá.",
        };

  return (
    <section className="relative h-[60vh] min-h-[420px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2070"
          alt="Luxury Stay"
          className="w-full h-full object-cover scale-105 animate-kenburns"
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/40 via-transparent to-navy-dark/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <ScrollReveal direction="up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-md border border-gold/30">
            {copy.eyebrow}
          </span>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
            {copy.title} <span className="text-gold italic">{copy.accent}</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
            {copy.desc}
          </p>
          <div className="gold-divider mx-auto mt-8" />
        </ScrollReveal>
      </div>
    </section>
  );
};

export default AboutHero;
