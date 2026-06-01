// ==========================================
// Types & Interfaces
// ==========================================

export interface Hotel {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  location: string;
  city: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  images: string[];
  amenities: string[];
  promoted?: boolean;
  popular?: boolean;
  availableRoomCount?: number;
  lowestAvailablePrice?: number;
  rooms?: Room[];
  reviews?: Review[];
  policies?: string[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  image: string;
  images?: string[];
  price: number;
  maxGuests: number;
  size: number;
  amenities: string[];
  quantityAvailable: number;
  availableUnits?: number;
}

export interface Review {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  images?: string[];
  videos?: string[];
}

// ==========================================
// Promotions Data
// ==========================================

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  code: string;
  image: string;
}

export const promotions: Promotion[] = [
  {
    id: "promo-1",
    title: "Mùa Hè Rực Rỡ",
    description: "Giảm giá đặc biệt cho kỳ nghỉ hè tại các resort ven biển sang trọng nhất Việt Nam.",
    discount: 20,
    code: "SUMMER20",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=2070",
  },
  {
    id: "promo-2",
    title: "Đặt Sớm Giá Tốt",
    description: "Đặt phòng trước 30 ngày để nhận ưu đãi giảm giá lên đến 30% cho mọi loại phòng.",
    discount: 30,
    code: "EARLY30",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2070",
  },
  {
    id: "promo-3",
    title: "Cuối Tuần Thư Giãn",
    description: "Tận hưởng kỳ nghỉ cuối tuần với gói ưu đãi bao gồm bữa sáng và spa miễn phí.",
    discount: 15,
    code: "WEEKEND15",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=2070",
  },
];
