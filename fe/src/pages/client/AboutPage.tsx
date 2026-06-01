import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/common/ScrollReveal";
import AboutHero from "@/components/home/AboutHero";
import {
  Award,
  Users,
  Globe,
  ShieldCheck,
  Quote,
  Sparkles,
  Star,
  Heart,
  Building2,
  Clock,
  MapPin,
  Trophy,
  Gem,
  Crown,
  Hotel,
  CheckCircle2,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const AboutPage = () => {
  const { language } = useLocale();

  const copy =
    language === "en"
      ? {
          /* ── Story Section ── */
          legacyEyebrow: "Our Legacy",
          storyTitle: "A Story of",
          storyAccent: "Perfection",
          story1:
            "Founded in 2010, Luxury Stay is more than a hotel collection. It is a commitment to excellence. We believe travel is not only where you go, but how you feel when you are there.",
          story2:
            "With a professional team and rooms designed by leading architects, we are proud to be an ideal destination for travelers seeking refinement and privacy.",
          stat1Value: "15+",
          stat1Label: "Years of Excellence",
          stat2Value: "50+",
          stat2Label: "Luxury Properties",
          stat3Value: "500K+",
          stat3Label: "Happy Guests",
          stat4Value: "99%",
          stat4Label: "Satisfaction Rate",

          /* ── Core Values ── */
          valuesEyebrow: "LuxStay Philosophy",
          valuesTitle: "Core Values",
          valuesSubtitle:
            "We place the guest at the center of every creative decision",
          values: [
            {
              icon: ShieldCheck,
              title: "Absolute Safety",
              desc: "Security and privacy are prioritized in every part of our operation.",
            },
            {
              icon: Globe,
              title: "Sustainability",
              desc: "A commitment to protecting the environment and supporting sustainable local tourism.",
            },
            {
              icon: Award,
              title: "Five-Star Quality",
              desc: "International standards applied to every service detail, large or small.",
            },
            {
              icon: Heart,
              title: "Warm Hospitality",
              desc: "A welcoming team ready to serve 24/7 with genuine care.",
            },
          ],

          /* ── Timeline ── */
          timelineEyebrow: "Our Journey",
          timelineTitle: "Milestone",
          timelineAccent: "Moments",
          timelineDesc:
            "Take a look at the historical landmarks that shaped our luxury legacy.",
          timeline: [
            {
              year: "2010",
              title: "The Beginning",
              desc: "First boutique hotel opened in the heart of Hanoi, establishing our brand.",
            },
            {
              year: "2015",
              title: "Resort Expansion",
              desc: "Launched world-class oceanfront resorts in Nha Trang, Quy Nhon, and Da Nang.",
            },
            {
              year: "2020",
              title: "Global Recognition",
              desc: "Awarded 'Asia's Leading Luxury Hotel Chain' at the World Travel Awards.",
            },
            {
              year: "2024",
              title: "Digital Luxury Era",
              desc: "Introducing advanced digital guest systems, online checkout, and smart rooms.",
            },
            {
              year: "2026",
              title: "Future Vision",
              desc: "Expanding to Southeast Asia with 20+ new properties and AI-powered concierge.",
            },
          ],

          /* ── Team ── */
          teamEyebrow: "Leadership",
          teamTitle: "Meet Our",
          teamAccent: "Team",
          teamDesc:
            "The visionaries behind the Luxury Stay experience, bringing decades of hospitality expertise.",
          teamMembers: [
            {
              name: "Alexander Sterling",
              role: "Founder & CEO",
              desc: "15+ years shaping luxury hospitality across Asia",
              img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
            },
            {
              name: "Victoria Nguyễn",
              role: "Chief Experience Officer",
              desc: "Former Ritz-Carlton guest experience director",
              img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
            },
            {
              name: "David Trần",
              role: "Head of Architecture",
              desc: "Award-winning designer of 30+ luxury properties",
              img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
            },
          ],

          /* ── Awards ── */
          awardsEyebrow: "Recognition",
          awardsTitle: "Awards &",
          awardsAccent: "Accolades",
          awards: [
            "World Travel Awards — Asia's Leading Luxury Hotel Chain 2023",
            "TripAdvisor Travelers' Choice — Top 1% Worldwide",
            "Forbes Travel Guide — Five-Star Rating 2024",
            "Condé Nast Traveler — Readers' Choice Award",
            "Booking.com — Traveller Review Award 9.6/10",
            "World Luxury Hotel Awards — Best Boutique Hotel",
          ],

          /* ── Founder Quote ── */
          founderEyebrow: "A Message From The Founder",
          founderQuote:
            "Luxury is not about features or price tags. It is about how deeply we care for the human experience of our guests. Every room, every smile, every detail — that is our art.",
          founderName: "Alexander Sterling",
          founderRole: "Founder & CEO, Luxury Stay",

          /* ── CTA ── */
          ctaTitle: "Experience Luxury Stay",
          ctaDesc:
            "Book your stay today and discover the art of refined hospitality.",
          ctaBtn: "Explore Hotels",
        }
      : {
          /* ── Story Section ── */
          legacyEyebrow: "Di Sản Của Chúng Tôi",
          storyTitle: "Câu Chuyện Của",
          storyAccent: "Sự Hoàn Hảo",
          story1:
            "Được thành lập từ năm 2010, Luxury Stay không chỉ là một chuỗi khách sạn. Đó là một cam kết về sự xuất sắc. Chúng tôi tin rằng du lịch không chỉ là đi đến một nơi nào đó, mà là cách bạn cảm nhận khi ở đó.",
          story2:
            "Với đội ngũ nhân viên chuyên nghiệp và hệ thống phòng nghỉ được thiết kế bởi các kiến trúc sư hàng đầu, chúng tôi tự hào là điểm dừng chân lý tưởng cho những du khách tìm kiếm sự tinh tế và riêng tư.",
          stat1Value: "15+",
          stat1Label: "Năm Kiến Tạo",
          stat2Value: "50+",
          stat2Label: "Bất Động Sản Cao Cấp",
          stat3Value: "500K+",
          stat3Label: "Khách Hàng Hài Lòng",
          stat4Value: "99%",
          stat4Label: "Tỉ Lệ Hài Lòng",

          /* ── Core Values ── */
          valuesEyebrow: "Triết Lý LuxStay",
          valuesTitle: "Giá Trị Cốt Lõi",
          valuesSubtitle:
            "Chúng tôi đặt khách hàng làm trung tâm của mọi sự sáng tạo",
          values: [
            {
              icon: ShieldCheck,
              title: "An Toàn Tuyệt Đối",
              desc: "Hệ thống an ninh và riêng tư được đặt lên hàng đầu trong mọi hoạt động.",
            },
            {
              icon: Globe,
              title: "Bền Vững",
              desc: "Cam kết bảo vệ môi trường và phát triển du lịch bền vững tại địa phương.",
            },
            {
              icon: Award,
              title: "Chất Lượng 5 Sao",
              desc: "Tiêu chuẩn quốc tế áp dụng cho mọi dịch vụ từ nhỏ nhất.",
            },
            {
              icon: Heart,
              title: "Thân Thiện & Tận Tâm",
              desc: "Đội ngũ nhân viên nồng hậu, sẵn sàng phục vụ 24/7 với nụ cười trên môi.",
            },
          ],

          /* ── Timeline ── */
          timelineEyebrow: "Hành Trình Phát Triển",
          timelineTitle: "Cột Mốc",
          timelineAccent: "Lịch Sử",
          timelineDesc:
            "Nhìn lại những dấu ấn quan trọng đã định hình nên di sản nghỉ dưỡng xa hoa của chúng tôi.",
          timeline: [
            {
              year: "2010",
              title: "Khởi Đầu Di Sản",
              desc: "Khách sạn Boutique đầu tiên được khai trương tại thủ đô Hà Nội, đặt nền móng thương hiệu.",
            },
            {
              year: "2015",
              title: "Vươn Ra Biển Lớn",
              desc: "Ra mắt các khu nghỉ dưỡng sát biển đẳng cấp quốc tế tại Nha Trang, Quy Nhơn và Đà Nẵng.",
            },
            {
              year: "2020",
              title: "Vinh Danh Quốc Tế",
              desc: "Được vinh danh là 'Chuỗi khách sạn sang trọng hàng đầu Châu Á' tại World Travel Awards.",
            },
            {
              year: "2024",
              title: "Kỷ Nguyên Số Xa Hoa",
              desc: "Tiên phong ứng dụng hệ thống trợ lý số, check-in không chạm và phòng nghỉ thông minh.",
            },
            {
              year: "2026",
              title: "Tầm Nhìn Tương Lai",
              desc: "Mở rộng ra Đông Nam Á với 20+ cơ sở mới và dịch vụ concierge thông minh AI.",
            },
          ],

          /* ── Team ── */
          teamEyebrow: "Đội Ngũ Lãnh Đạo",
          teamTitle: "Gặp Gỡ",
          teamAccent: "Lãnh Đạo",
          teamDesc:
            "Những người tiên phong đứng sau trải nghiệm Luxury Stay, mang đến hàng thập kỷ chuyên môn lưu trú.",
          teamMembers: [
            {
              name: "Alexander Sterling",
              role: "Nhà Sáng Lập & CEO",
              desc: "15+ năm định hình ngành khách sạn sang trọng tại Châu Á",
              img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
            },
            {
              name: "Victoria Nguyễn",
              role: "Giám Đốc Trải Nghiệm",
              desc: "Cựu giám đốc trải nghiệm khách hàng tại Ritz-Carlton",
              img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
            },
            {
              name: "David Trần",
              role: "Trưởng Bộ Phận Kiến Trúc",
              desc: "Nhà thiết kế đạt giải thưởng cho 30+ bất động sản cao cấp",
              img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
            },
          ],

          /* ── Awards ── */
          awardsEyebrow: "Ghi Nhận",
          awardsTitle: "Giải Thưởng &",
          awardsAccent: "Vinh Danh",
          awards: [
            "World Travel Awards — Chuỗi Khách Sạn Sang Trọng Hàng Đầu Châu Á 2023",
            "TripAdvisor Travelers' Choice — Top 1% Toàn Cầu",
            "Forbes Travel Guide — Xếp Hạng 5 Sao 2024",
            "Condé Nast Traveler — Giải Readers' Choice",
            "Booking.com — Traveller Review Award 9.6/10",
            "World Luxury Hotel Awards — Khách Sạn Boutique Tốt Nhất",
          ],

          /* ── Founder Quote ── */
          founderEyebrow: "Thông Điệp Từ Nhà Sáng Lập",
          founderQuote:
            "Sự sang trọng không nằm ở giá cả hay những thứ hào nhoáng bên ngoài. Nó nằm ở mức độ sâu sắc trong cách chúng tôi chăm sóc trải nghiệm con người. Mỗi căn phòng, mỗi nụ cười, mỗi chi tiết — đó là nghệ thuật của chúng tôi.",
          founderName: "Alexander Sterling",
          founderRole: "Nhà Sáng Lập & CEO, Luxury Stay",

          /* ── CTA ── */
          ctaTitle: "Trải Nghiệm Luxury Stay",
          ctaDesc:
            "Đặt phòng ngay hôm nay và khám phá nghệ thuật nghỉ dưỡng tinh tế.",
          ctaBtn: "Khám Phá Khách Sạn",
        };

  const stats = [
    { value: copy.stat1Value, label: copy.stat1Label, icon: Clock },
    { value: copy.stat2Value, label: copy.stat2Label, icon: Building2 },
    { value: copy.stat3Value, label: copy.stat3Label, icon: Users },
    { value: copy.stat4Value, label: copy.stat4Label, icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#f5f1ea]">
      <Header />

      <AboutHero />

      {/* ════════════════════════════════════════
          STATS BAR — Full-width navy bar with gold accents
      ════════════════════════════════════════ */}
      <section className="bg-gradient-navy border-y border-white/10">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-0 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={i} delay={(i + 1) as any} direction="up">
                <div
                  className={`flex flex-col items-center justify-center py-10 text-center ${
                    i < stats.length - 1
                      ? "border-r border-white/10"
                      : ""
                  }`}
                >
                  <Icon className="mb-3 h-5 w-5 text-gold" />
                  <p className="font-heading text-3xl font-bold text-white md:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════
          STORY SECTION — Cream background with image + text
      ════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8 items-center">
          {/* Image */}
          <ScrollReveal direction="left">
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-[0_28px_65px_-36px_rgba(2,6,23,0.4)]">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2070"
                  alt="Luxury Stay Hotel"
                  className="h-[420px] w-full object-cover transition-transform duration-[1.2s] hover:scale-105 md:h-[520px]"
                />
              </div>
              {/* Floating experience badge */}
              <div className="absolute -bottom-6 -right-2 z-20 rounded-[1.5rem] border border-white/10 bg-gradient-navy p-5 shadow-2xl animate-float md:-right-6">
                <p className="font-heading text-3xl font-bold text-gold">
                  15+
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  {copy.stat1Label}
                </p>
              </div>
              {/* Decorative dot pattern */}
              <div className="absolute -left-4 -top-4 -z-10 h-32 w-32 rounded-[1.5rem] border-2 border-dashed border-gold/20 md:-left-8 md:-top-8" />
            </div>
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal direction="right">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-10 bg-gold" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                  {copy.legacyEyebrow}
                </span>
              </div>
              <h2 className="font-heading text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                {copy.storyTitle}{" "}
                <span className="italic text-gold">{copy.storyAccent}</span>
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-500">
                <p>{copy.story1}</p>
                <p>{copy.story2}</p>
              </div>

              {/* Mini awards row */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-6">
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      World Travel Awards
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Asia's Leading 2023
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Forbes Five-Star
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Rating 2024
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CORE VALUES — White cards on cream background
      ════════════════════════════════════════ */}
      <section className="pb-20 md:pb-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <ScrollReveal direction="up">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                <Sparkles className="h-3.5 w-3.5" /> {copy.valuesEyebrow}
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 md:text-5xl">
                {copy.valuesTitle}
              </h2>
              <div className="gold-divider mx-auto mt-5" />
              <p className="mx-auto mt-5 max-w-2xl text-[15px] italic leading-relaxed text-slate-500">
                "{copy.valuesSubtitle}"
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {copy.values.map((val, i) => {
              const Icon = val.icon;
              return (
                <ScrollReveal
                  key={i}
                  delay={(i + 1) as any}
                  direction="up"
                >
                  <div className="group relative h-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.18)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_65px_-30px_rgba(15,23,42,0.25)]">
                    {/* Big decorative index */}
                    <span className="absolute right-6 top-6 select-none font-heading text-[4.5rem] font-bold leading-none text-slate-100 transition-colors duration-500 group-hover:text-gold/10">
                      0{i + 1}
                    </span>

                    <div className="relative z-10">
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mb-3 font-heading text-xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-gold">
                        {val.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-500">
                        {val.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TIMELINE — Navy gradient background
      ════════════════════════════════════════ */}
      <section className="overflow-hidden border-y border-white/10 bg-gradient-navy py-20 text-white md:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <ScrollReveal direction="up">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                {copy.timelineEyebrow}
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold md:text-5xl">
                {copy.timelineTitle}{" "}
                <span className="italic text-gold">{copy.timelineAccent}</span>
              </h2>
              <div className="mx-auto mt-5 h-[2px] w-16 bg-gold" />
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60">
                {copy.timelineDesc}
              </p>
            </ScrollReveal>
          </div>

          {/* Timeline nodes */}
          <div className="relative">
            {/* Center line (desktop) / Left line (mobile) */}
            <div className="absolute bottom-0 left-4 top-0 w-[2px] bg-gold/20 md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-14 md:space-y-16">
              {copy.timeline.map((node, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div key={i} className="relative">
                    {/* Dot */}
                    <div className="absolute left-[10px] top-1 z-10 h-5 w-5 rounded-full border-4 border-navy bg-gold shadow-[0_0_12px_rgba(212,175,55,0.7)] md:left-1/2 md:-translate-x-1/2" />

                    {/* Content card */}
                    <div
                      className={`ml-12 md:ml-0 md:w-[44%] ${
                        isEven
                          ? "md:ml-auto md:pl-0 md:pr-10 md:text-right"
                          : "md:mr-auto md:pl-10 md:text-left"
                      }`}
                    >
                      <ScrollReveal direction={isEven ? "right" : "left"}>
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-6 backdrop-blur-md transition-all duration-500 hover:border-gold/30 hover:bg-white/10">
                          <span className="font-heading text-2xl font-bold text-gold md:text-3xl">
                            {node.year}
                          </span>
                          <h4 className="mt-2 text-lg font-bold text-white">
                            {node.title}
                          </h4>
                          <p className="mt-2 text-sm leading-relaxed text-white/60">
                            {node.desc}
                          </p>
                        </div>
                      </ScrollReveal>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TEAM SECTION — Cream background with cards
      ════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <ScrollReveal direction="up">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                {copy.teamEyebrow}
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 md:text-5xl">
                {copy.teamTitle}{" "}
                <span className="italic text-gold">{copy.teamAccent}</span>
              </h2>
              <div className="gold-divider mx-auto mt-5" />
              <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-500">
                {copy.teamDesc}
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {copy.teamMembers.map((member, i) => (
              <ScrollReveal
                key={i}
                delay={(i + 1) as any}
                direction="up"
              >
                <div className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_24px_50px_-38px_rgba(15,23,42,0.18)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_65px_-30px_rgba(15,23,42,0.25)]">
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={member.img}
                      alt={member.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-xl font-bold text-slate-900 transition-colors group-hover:text-gold">
                      {member.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {member.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          AWARDS MARQUEE — Light cream section
      ════════════════════════════════════════ */}
      <section className="overflow-hidden border-y border-slate-200/50 bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <ScrollReveal direction="up">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                {copy.awardsEyebrow}
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900 md:text-4xl">
                {copy.awardsTitle}{" "}
                <span className="italic text-gold">{copy.awardsAccent}</span>
              </h2>
            </ScrollReveal>
          </div>
        </div>

        {/* Scrolling marquee */}
        <div className="marquee-mask">
          <div className="animate-marquee">
            {[...copy.awards, ...copy.awards].map((award, i) => (
              <div
                key={i}
                className="mx-3 flex shrink-0 items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-[#f5f1ea] px-6 py-4 shadow-sm"
              >
                <Crown className="h-5 w-5 shrink-0 text-gold" />
                <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                  {award}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOUNDER QUOTE — Navy gradient
      ════════════════════════════════════════ */}
      <section className="bg-gradient-navy py-20 text-white md:py-28">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="scale">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/6 p-10 backdrop-blur-md md:p-16">
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold/8 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-14">
                {/* Founder image */}
                <div className="h-40 w-40 shrink-0 overflow-hidden rounded-[2rem] border-4 border-gold/30 shadow-xl lg:h-48 lg:w-48">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                    alt={copy.founderName}
                    className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  />
                </div>

                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <div className="flex items-center justify-center gap-3 lg:justify-start">
                    <Quote className="h-8 w-8 -scale-x-100 text-gold opacity-40" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                      {copy.founderEyebrow}
                    </span>
                  </div>

                  <p className="font-heading text-xl italic leading-relaxed tracking-wide text-white md:text-2xl">
                    "{copy.founderQuote}"
                  </p>

                  <div className="border-t border-white/10 pt-5">
                    <p className="text-lg font-bold text-gold">
                      {copy.founderName}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                      {copy.founderRole}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA SECTION — Gold gradient
      ════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-gold p-12 text-center shadow-[0_28px_60px_-30px_rgba(212,175,55,0.5)] md:p-16">
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full border-2 border-primary/10" />
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full border-2 border-primary/10" />

              <div className="relative z-10">
                <Gem className="mx-auto mb-5 h-10 w-10 text-primary/70" />
                <h2 className="font-heading text-3xl font-bold text-primary md:text-4xl">
                  {copy.ctaTitle}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-primary/70">
                  {copy.ctaDesc}
                </p>
                <a
                  href="/hotels"
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-primary-foreground shadow-luxury transition-all hover:opacity-90 active:scale-95"
                >
                  <Hotel className="h-4 w-4" />
                  {copy.ctaBtn}
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
