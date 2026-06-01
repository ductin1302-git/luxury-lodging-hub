import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import HotelCard from "@/components/hotels/HotelCard";
import ScrollReveal from "@/components/common/ScrollReveal";
import { apiFetch } from "@/services/apiClient";
import { Hotel } from "@/data/hotels";
import { Loader2, ArrowRight } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const FeaturedHotels = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLocale();
  const copy =
    language === "en"
      ? {
          titleStart: "Featured",
          titleAccent: "Hotels",
          desc: "Discover carefully selected destinations designed for refined luxury stays.",
          viewAll: "View all",
          loading: "Loading collection...",
        }
      : {
          titleStart: "Khách sạn",
          titleAccent: "Nổi bật",
          desc: "Khám phá những điểm đến được tuyển chọn kỹ lưỡng, mang đến trải nghiệm nghỉ dưỡng xa hoa.",
          viewAll: "Xem tất cả",
          loading: "Đang tải bộ sưu tập...",
        };

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await apiFetch("/hotels");
        const mappedData = data.map((h: any) => ({
          ...h,
          images: h.images?.map((img: any) => img.url || img) || [],
          amenities: h.amenities?.map((a: any) => a.name || a) || []
        }));
        setHotels(mappedData.slice(0, 4));
      } catch (error) {
        console.error("Error fetching featured hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  return (
    <section className="h-full w-full bg-white relative overflow-hidden flex items-center">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/50 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] relative z-10 py-6">
        <ScrollReveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-4 xl:mb-6 gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-[2px] bg-gold rounded-full" />
                <span className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">Signature Collection</span>
              </div>
              <h2 className="font-heading text-3xl md:text-5xl xl:text-5xl font-black text-slate-900 mb-3 tracking-tighter italic leading-none">
                {copy.titleStart} <span className="text-gold">{copy.titleAccent}</span>
              </h2>
              <p className="text-slate-500 text-xs xl:text-sm leading-relaxed font-medium max-w-xl">
                {copy.desc}
              </p>
            </div>
            <Link 
              to="/hotels" 
              className="group flex items-center gap-4 bg-slate-950 text-white px-8 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gold hover:text-slate-950 transition-all shadow-lg active:scale-95"
            >
              {copy.viewAll} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
             <Loader2 className="w-12 h-12 text-gold animate-spin" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{copy.loading}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 mt-10 xl:mt-12">
            {hotels.map((hotel, index) => (
              <ScrollReveal 
                key={hotel.id} 
                delay={(index % 4) as any} 
                direction={index % 2 === 0 ? "left" : "right"}
              >
                <div className="h-full">
                  <HotelCard hotel={hotel} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedHotels;
