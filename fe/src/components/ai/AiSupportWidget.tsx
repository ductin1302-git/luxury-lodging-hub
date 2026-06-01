import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { BedDouble, Bot, ExternalLink, Image as ImageIcon, Loader2, MapPin, MessageCircle, Send, Sparkles, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/common/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { apiFetch, getImageUrl } from "@/services/apiClient";

type RelatedHotelCard = {
  id: string;
  slug?: string;
  name: string;
  city?: string;
  district?: string;
  location?: string;
  addressLine?: string;
  stars?: number;
  rating?: number;
  reviewCount?: number;
  pricePerNight?: number;
  description?: string;
  images?: string[];
  amenities?: string[];
  detailUrl?: string;
  rooms?: Array<{
    id: string;
    name: string;
    price?: number;
    salePrice?: number | null;
    maxGuests?: number;
    images?: string[];
  }>;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  hotels?: RelatedHotelCard[];
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createWelcomeMessage = (language: "vi" | "en", isSignedIn: boolean): ChatMessage => ({
  id: `welcome-${language}-${isSignedIn ? "user" : "guest"}`,
  role: "assistant",
  content:
    language === "en"
      ? isSignedIn
        ? "Hi, I am Luxury Stay AI. I can help with hotels, rooms, deals, payment status and your booking history."
        : "Hi, I am Luxury Stay AI. I can help you explore hotels, rooms, amenities, locations and hotel details. Please sign in to ask about bookings or payments."
      : isSignedIn
        ? "Xin chào, tôi là AI Luxury Stay. Tôi có thể hỗ trợ khách sạn, phòng, ưu đãi, thanh toán và lịch booking của bạn."
        : "Xin chào, tôi là AI Luxury Stay. Tôi có thể hỗ trợ bạn tìm hiểu khách sạn, phòng, tiện ích, vị trí và chi tiết khách sạn. Hãy đăng nhập để hỏi về booking hoặc thanh toán.",
});

const getHotelPath = (hotel: RelatedHotelCard) => hotel.detailUrl || `/hotel/${hotel.id || hotel.slug}`;

const AiSupportWidget = () => {
  const location = useLocation();
  const { language, formatCurrency } = useLocale();
  const { user } = useAuth();
  const isSignedIn = Boolean(user?.id);
  const sessionKey = user?.id || "guest";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(language, isSignedIn)]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sessionKeyRef = useRef(sessionKey);

  const hidden = location.pathname.startsWith("/admin") || location.pathname.startsWith("/LoginAdmin");

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            title: "Luxury Stay AI",
            status: "Online support",
            tooltip: "Open AI support",
            close: "Close AI support",
            placeholder: isSignedIn ? "Ask about hotels, deals, booking status..." : "Ask about hotels, rooms, amenities...",
            send: "Send",
            sending: "Sending",
            failed: "AI support is unavailable right now. Please try again or contact the hotline.",
            blocked: "Please rewrite your message politely before sending.",
            quickPrompts: isSignedIn
              ? [
                  "Which hotel is best for a family trip?",
                  "Show my latest booking",
                  "How can I change a booking?",
                ]
              : [
                  "Which hotel is best for a family trip?",
                  "Show hotels in Da Nang",
                  "Which hotel has a sea view?",
                ],
          }
        : {
            title: "AI Luxury Stay",
            status: "Hỗ trợ trực tuyến",
            tooltip: "Mở hỗ trợ AI",
            close: "Đóng hỗ trợ AI",
            placeholder: isSignedIn ? "Hỏi về khách sạn, ưu đãi, trạng thái booking..." : "Hỏi về khách sạn, phòng, tiện ích...",
            send: "Gửi",
            sending: "Đang gửi",
            failed: "AI hỗ trợ đang tạm thời không khả dụng. Vui lòng thử lại hoặc liên hệ hotline.",
            blocked: "Vui lòng viết lại nội dung lịch sự hơn trước khi gửi.",
            quickPrompts: isSignedIn
              ? [
                  "Khách sạn nào phù hợp cho gia đình?",
                  "Xem booking gần nhất của tôi",
                  "Tôi muốn đổi lịch đặt phòng",
                ]
              : [
                  "Khách sạn nào phù hợp cho gia đình?",
                  "Gợi ý khách sạn ở Đà Nẵng",
                  "Khách sạn nào có view biển?",
                ],
          },
    [isSignedIn, language],
  );

  const renderHotelCard = (hotel: RelatedHotelCard) => {
    const images = Array.isArray(hotel.images) ? hotel.images.filter(Boolean).slice(0, 4) : [];
    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms.slice(0, 2) : [];
    const amenities = Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 4) : [];

    return (
      <div key={hotel.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-36 w-full bg-slate-100">
          {images[0] ? (
            <img src={getImageUrl(images[0])} alt={hotel.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ImageIcon className="h-7 w-7" />
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm">
            {hotel.stars || 5}★
          </div>
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-3 gap-1 border-b border-slate-100 bg-slate-50 p-1">
            {images.slice(1, 4).map((image, index) => (
              <img
                key={`${hotel.id}-thumb-${index}`}
                src={getImageUrl(image)}
                alt={`${hotel.name} ${index + 2}`}
                className="h-14 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        <div className="space-y-3 p-3">
          <div>
            <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{hotel.name}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
              <span className="line-clamp-1">{hotel.addressLine || hotel.location || hotel.city}</span>
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              {Number(hotel.rating || 0).toFixed(1)} ({hotel.reviewCount || 0})
            </span>
            <span className="font-bold text-primary">{formatCurrency(Number(hotel.pricePerNight || 0))}</span>
          </div>

          {hotel.description && (
            <p className="line-clamp-2 text-xs leading-5 text-slate-600">{hotel.description}</p>
          )}

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((amenity) => (
                <span key={amenity} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {amenity}
                </span>
              ))}
            </div>
          )}

          {rooms.length > 0 && (
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-2">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-600">
                    <BedDouble className="h-3.5 w-3.5 shrink-0 text-gold" />
                    <span className="truncate">{room.name}</span>
                  </span>
                  <span className="shrink-0 font-bold text-slate-900">{formatCurrency(Number(room.salePrice || room.price || 0))}</span>
                </div>
              ))}
            </div>
          )}

          <Link
            to={getHotelPath(hotel)}
            onClick={() => setIsOpen(false)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white transition-colors hover:bg-primary/90"
          >
            {language === "en" ? "View details" : "Xem chi tiết"}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setMessages((prev) => (prev.length === 1 && prev[0].id.startsWith("welcome") ? [createWelcomeMessage(language, isSignedIn)] : prev));
  }, [isSignedIn, language]);

  useEffect(() => {
    if (sessionKeyRef.current === sessionKey) return;
    sessionKeyRef.current = sessionKey;
    setInput("");
    setIsSending(false);
    setMessages([createWelcomeMessage(language, isSignedIn)]);
  }, [isSignedIn, language, sessionKey]);

  useEffect(() => {
    if (hidden) {
      setIsOpen(false);
    }
  }, [hidden]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages]);

  const sendMessage = async (preset?: string) => {
    const content = String(preset ?? input).trim();
    if (!content || isSending) return;

    const requestSessionKey = sessionKeyRef.current;
    setInput("");
    setIsSending(true);
    setMessages((prev) => [...prev, { id: createId(), role: "user", content }]);

    try {
      const response = await apiFetch("/ai/support", {
        method: "POST",
        body: JSON.stringify({
          message: content,
          language,
          pageUrl: window.location.href,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });

      if (sessionKeyRef.current === requestSessionKey) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content: response?.answer || copy.failed,
            hotels: Array.isArray(response?.relatedHotels) ? response.relatedHotels : [],
          },
        ]);
      }
    } catch (error: any) {
      const message = error?.status === 400 ? error?.message || copy.blocked : error?.message || copy.failed;
      if (sessionKeyRef.current === requestSessionKey) {
        setMessages((prev) => [...prev, { id: createId(), role: "assistant", content: message }]);
        toast.error(message);
      }
    } finally {
      if (sessionKeyRef.current === requestSessionKey) {
        setIsSending(false);
      }
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-3 right-2 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="flex max-h-[calc(100dvh-5.5rem)] w-[min(calc(100vw-1rem),440px)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_28px_70px_-28px_rgba(15,23,42,0.45)] sm:max-h-[calc(100dvh-7rem)] sm:w-[min(calc(100vw-2rem),440px)]">
          <div className="shrink-0 flex items-center justify-between bg-gradient-navy px-4 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{copy.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/68">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {copy.status}
                </p>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-white/72 transition-colors hover:text-white"
                  aria-label={copy.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{copy.close}</TooltipContent>
            </Tooltip>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={message.role === "user" ? "max-w-[84%]" : "w-full max-w-[94%] space-y-2"}>
                  <div
                    className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "border border-slate-100 bg-white text-slate-700"
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.role === "assistant" && Boolean(message.hotels?.length) && (
                    <div className="space-y-2">
                      {message.hotels!.map((hotel) => renderHotelCard(hotel))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  {copy.sending}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {copy.quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-600 transition-colors hover:border-gold/50 hover:bg-amber-50 hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/10">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={1}
                placeholder={copy.placeholder}
                className="max-h-24 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-gold text-primary shadow-[0_14px_24px_-16px_rgba(212,175,55,0.8)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={copy.send}
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{copy.send}</TooltipContent>
              </Tooltip>
            </div>
          </form>
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className={`group flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold text-primary shadow-[0_18px_38px_-18px_rgba(15,23,42,0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-18px_rgba(15,23,42,0.75)] ${isOpen ? "" : "ai-contact-launcher"}`}
            aria-label={copy.tooltip}
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            {!isOpen && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-gold">
                <Sparkles className="h-3 w-3" />
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{copy.tooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default AiSupportWidget;
