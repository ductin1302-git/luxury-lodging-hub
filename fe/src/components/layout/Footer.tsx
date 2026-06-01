import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Linkedin, ArrowRight, Send } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import ScrollReveal from "@/components/common/ScrollReveal";
import { useLocale } from "@/contexts/LocaleContext";

const Footer = () => {
  const { language } = useLocale();
  const copy =
    language === "en"
      ? {
          desc: "Crafting distinctive luxury stay experiences. We connect you with architectural landmarks and world-class hospitality.",
          explore: "Explore",
          links: [
            ["Hotels", "/hotels"],
            ["Deals", "/promotions"],
            ["News", "/news"],
            ["About", "/about"],
            ["Contact", "/contact"],
          ],
          support: "Support",
          supportLinks: ["FAQ", "Refund policy", "Terms of use", "Privacy"],
          newsletter: "Exclusive Newsletter",
          newsletterDesc: "Subscribe for private offers and the latest Luxury Stay updates.",
          emailPlaceholder: "Your email...",
          send: "Send",
        }
      : {
          desc: "Kiến tạo những trải nghiệm nghỉ dưỡng xa hoa và độc bản. Chúng tôi kết nối bạn với những tuyệt tác kiến trúc và dịch vụ đẳng cấp nhất hành tinh.",
          explore: "Khám Phá",
          links: [
            ["Khách sạn", "/hotels"],
            ["Ưu đãi", "/promotions"],
            ["Tin tức", "/news"],
            ["Giới thiệu", "/about"],
            ["Liên hệ", "/contact"],
          ],
          support: "Hỗ Trợ",
          supportLinks: ["FAQ", "Chính sách hoàn tiền", "Điều khoản sử dụng", "Bảo mật"],
          newsletter: "Bản Tin Đặc Quyền",
          newsletterDesc: "Đăng ký để nhận những ưu đãi bí mật và cập nhật mới nhất từ Luxury Stay.",
          emailPlaceholder: "Email của bạn...",
          send: "Gửi",
        };

  return (
  <footer className="bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
    {/* Decorative Ambient Glow */}
    <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

    <div className="container mx-auto px-6 lg:px-12 pt-20 pb-10 relative z-10 max-w-[1500px]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24 mb-20">
        {/* Brand Section */}
        <div className="lg:col-span-4">
          <ScrollReveal direction="up" delay={1}>
            <div className="flex items-center gap-4 mb-8 group cursor-pointer">
              <BrandLogo className="h-12 w-12 transition-transform duration-700 group-hover:rotate-[360deg]" />
              <div>
                <h3 className="font-heading text-2xl font-black tracking-tighter leading-none">LUXURY STAY</h3>
                <span className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">International</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              {copy.desc}
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:bg-gold hover:text-slate-950 hover:border-gold transition-all duration-500">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2">
          <ScrollReveal direction="up" delay={2}>
            <h4 className="font-heading text-lg font-bold mb-8 text-white">{copy.explore}</h4>
            <ul className="space-y-4">
              {copy.links.map(([item, path]) => (
                <li key={item}>
                  <Link to={path} className="text-sm text-slate-400 hover:text-gold transition-all duration-300 flex items-center gap-2 group">
                    <div className="w-0 h-[1px] bg-gold group-hover:w-4 transition-all" /> {item}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>

        {/* Support */}
        <div className="lg:col-span-2">
          <ScrollReveal direction="up" delay={3}>
            <h4 className="font-heading text-lg font-bold mb-8 text-white">{copy.support}</h4>
            <ul className="space-y-4">
              {copy.supportLinks.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-gold transition-all duration-300 flex items-center gap-2 group">
                    <div className="w-0 h-[1px] bg-gold group-hover:w-4 transition-all" /> {item}
                  </a>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>

        {/* Newsletter */}
        <div className="lg:col-span-4">
          <ScrollReveal direction="up" delay={4}>
            <h4 className="font-heading text-lg font-bold mb-8 text-white">{copy.newsletter}</h4>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {copy.newsletterDesc}
            </p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder={copy.emailPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-gold transition-all placeholder:text-slate-600"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-gold hover:bg-white text-slate-950 px-6 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                {copy.send} <Send className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Hotline 24/7</span>
                  <span className="text-gold font-bold text-lg tracking-tighter">1900 1234</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Email</span>
                  <span className="text-white font-bold text-sm tracking-tight">vip@luxurystay.vn</span>
               </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-medium text-slate-500 tracking-wide">
        <p>© 2026 LUXURY STAY HOTEL. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-gold transition-colors">PRIVACY POLICY</a>
          <a href="#" className="hover:text-gold transition-colors">TERMS OF SERVICE</a>
          <a href="#" className="hover:text-gold transition-colors">COOKIE POLICY</a>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
