import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface BookingItem {
  id: string;
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomName: string;
  roomPrice: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  nights: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequest: string;
  paymentMethod: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
  promoCode: string;
  promoTitle?: string;
  promoDiscountType?: "percent" | "amount";
  promoDiscountValue?: number;
  promoMinOrderAmount?: number;
  arrivalTime?: string;
}

interface BookingContextType {
  bookings: BookingItem[];
  currentBooking: Partial<BookingItem> | null;
  setCurrentBooking: (b: Partial<BookingItem> | null) => void;
  addBooking: (b: BookingItem) => void;
  cancelBooking: (id: string) => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
};

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<BookingItem[]>(() => {
    const saved = localStorage.getItem("hotel_bookings");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentBooking, setCurrentBooking] = useState<Partial<BookingItem> | null>(null);

  useEffect(() => {
    localStorage.setItem("hotel_bookings", JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = (b: BookingItem) => setBookings((prev) => [...prev, b]);
  const cancelBooking = (id: string) =>
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b)));

  return (
    <BookingContext.Provider value={{ bookings, currentBooking, setCurrentBooking, addBooking, cancelBooking }}>
      {children}
    </BookingContext.Provider>
  );
};
