import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = "vi" | "en";
export type AppCurrency = "VND" | "USD";

type LocaleContextValue = {
  language: AppLanguage;
  currency: AppCurrency;
  setLanguage: (language: AppLanguage) => void;
  setCurrency: (currency: AppCurrency) => void;
  t: (key: string) => string;
  formatCurrency: (valueInVnd: number) => string;
};

const STORAGE_KEY = "luxury_locale_preferences";
const LEGACY_PROFILE_KEY = "luxury_profile_preferences";
const VND_PER_USD = 25500;

const dictionary: Record<AppLanguage, Record<string, string>> = {
  vi: {
    "nav.home": "Trang chủ",
    "nav.hotels": "Khách sạn",
    "nav.promotions": "Ưu đãi",
    "nav.about": "Giới thiệu",
    "nav.news": "Tin tức",
    "nav.contact": "Liên hệ",
    "auth.login": "Đăng nhập",
    "auth.register": "Đăng ký",
    "menu.notifications": "Trung tâm thông báo",
    "menu.profile": "Thông tin hồ sơ",
    "menu.favorites": "Khách sạn yêu thích",
    "menu.bookings": "Lịch sử đặt phòng",
    "menu.settings": "Cài đặt tài khoản",
    "menu.admin": "Quản trị Admin",
    "menu.logout": "Đăng xuất",
    "menu.logoutSuccess": "Đăng xuất thành công!",
    "search.destination": "Điểm đến",
    "search.chooseDestination": "Chọn điểm đến",
    "search.checkIn": "Nhận phòng",
    "search.checkOut": "Trả phòng",
    "search.guests": "Khách",
    "search.rooms": "Phòng",
    "search.submit": "Tìm kiếm",
    "hotels.all": "Tất cả khách sạn",
    "hotels.inCity": "Khách sạn tại {city}",
    "hotels.filteredBy": "Danh sách được lọc theo điểm đến, ngày lưu trú, số khách và số phòng còn trống.",
    "hotels.allDestinations": "Tất cả điểm đến",
    "hotels.pickDates": "Chọn ngày để xem phòng trống chính xác",
    "hotels.guestCount": "{count} khách",
    "hotels.roomCount": "{count} phòng",
    "hotels.sort.popular": "Phổ biến nhất",
    "hotels.sort.priceAsc": "Giá tăng dần",
    "hotels.sort.priceDesc": "Giá giảm dần",
    "hotels.sort.rating": "Đánh giá cao",
    "hotels.loading": "Đang tải danh sách khách sạn...",
    "hotels.emptyTitle": "Không tìm thấy khách sạn phù hợp",
    "hotels.emptyHint": "Hãy thử nới rộng mức giá, bỏ bớt bộ lọc hoặc đổi ngày lưu trú.",
    "hotels.filter": "Bộ lọc",
    "hotels.reset": "Đặt lại",
    "hotels.price": "Mức giá",
    "hotels.allPrices": "Tất cả mức giá",
    "hotels.upTo": "Đến {price}",
    "hotels.stars": "Số sao",
    "hotels.star": "{count} sao",
    "hotels.amenities": "Tiện nghi",
    "hotelCard.deal": "Ưu đãi",
    "hotelCard.roomTypes": "{count} loại phòng",
    "hotelCard.reviews": "{count} đánh giá",
    "hotelCard.pool": "Hồ bơi",
    "hotelCard.wifi": "Wifi",
    "hotelCard.dining": "Ẩm thực",
    "hotelCard.from": "Giá từ",
    "hotelCard.perNight": "/ đêm",
    "room.maxGuests": "Tối đa {count} khách",
    "room.left": "Chỉ còn {count} phòng",
    "room.available": "Còn {count} phòng",
    "room.soldOut": "Hết phòng",
    "room.viewDetails": "Xem chi tiết",
    "room.select": "Chọn phòng",
    "room.pricePerNight": "Giá mỗi đêm",
    "settings.title": "Cài đặt tài khoản",
    "settings.subtitle": "Cập nhật thông tin cá nhân, mật khẩu và các tùy chọn sử dụng website trong một nơi riêng biệt.",
    "settings.backProfile": "Quay lại trang cá nhân",
    "settings.manageProfile": "Quản lý hồ sơ Luxury Stay",
    "settings.profile": "Thông tin cá nhân",
    "settings.profileDesc": "Tên, số điện thoại và email đăng nhập",
    "settings.password": "Mật khẩu",
    "settings.passwordDesc": "Đổi hoặc thiết lập mật khẩu tài khoản",
    "settings.preferences": "Tùy chỉnh website",
    "settings.preferencesDesc": "Thông báo, ngôn ngữ, tiền tệ và cách hiển thị",
    "settings.name": "Họ tên",
    "settings.phone": "Số điện thoại",
    "settings.email": "Email đăng nhập",
    "settings.saveInfo": "Lưu thông tin",
    "settings.languageCurrency": "Ngôn ngữ và tiền tệ",
    "settings.displayOnly": "Tiền USD chỉ dùng để hiển thị tham khảo; thanh toán vẫn theo giá trị gốc của đơn.",
    "settings.emailDeals": "Nhận email ưu đãi",
    "settings.emailDealsDesc": "Gửi ưu đãi, mã giảm giá và gợi ý điểm đến phù hợp.",
    "settings.bookingReminder": "Nhắc lịch booking",
    "settings.bookingReminderDesc": "Nhận nhắc trước ngày nhận phòng và khi đơn thay đổi trạng thái.",
    "settings.compactBookings": "Danh sách booking gọn",
    "settings.compactBookingsDesc": "Hiển thị ít đơn hơn trên trang cá nhân để dễ quét nhanh.",
    "settings.currentPassword": "Mật khẩu hiện tại",
    "settings.newPassword": "Mật khẩu mới",
    "settings.confirmPassword": "Nhập lại mật khẩu",
    "settings.changePassword": "Đổi mật khẩu",
    "settings.setPassword": "Thiết lập mật khẩu",
    "settings.hasPassword": "Đã thiết lập mật khẩu",
    "settings.noPassword": "Chưa có mật khẩu riêng",
    "settings.loginBy": "Đăng nhập",
    "settings.savedProfile": "Đã cập nhật thông tin cá nhân",
    "settings.savedPassword": "Đã cập nhật mật khẩu",
    "profile.title": "Hồ sơ & lịch sử booking",
    "profile.subtitle": "Theo dõi đơn đặt phòng, quản lý thông tin cá nhân và tùy chỉnh trải nghiệm sử dụng Luxury Stay.",
    "profile.personalAccount": "Tài khoản cá nhân",
    "profile.newBooking": "Đặt phòng mới",
    "profile.memberOverview": "Tổng quan thành viên",
    "profile.spent": "Chi tiêu đã ghi nhận",
    "profile.memberHint": "Hoàn tất thêm booking hoặc thanh toán đơn hiện tại để nâng hạng và nhận ưu đãi tốt hơn.",
    "profile.bookingDetails": "Chi tiết lịch sử booking",
    "profile.bookingDetailsDesc": "Xem nhanh các đơn gần đây, trạng thái thanh toán, ngày lưu trú và tổng giá trị đơn.",
    "profile.viewAll": "Xem tất cả",
    "profile.loadingBookings": "Đang tải lịch sử booking...",
    "profile.noBookings": "Chưa có booking nào",
    "profile.noBookingsHint": "Khi bạn đặt phòng, toàn bộ lịch sử và chi tiết đơn sẽ xuất hiện tại đây.",
    "profile.findHotel": "Tìm khách sạn",
    "profile.totalBookings": "Tổng booking",
    "profile.activeOrders": "Đơn hoạt động",
    "profile.paidOrders": "Đã thanh toán",
    "profile.upcoming": "Sắp tới",
    "booking.status.pending": "Chờ xác nhận",
    "booking.status.confirmed": "Đã xác nhận",
    "booking.status.checked_in": "Đang lưu trú",
    "booking.status.checked_out": "Đã hoàn tất",
    "booking.status.cancelled": "Đã hủy",
    "booking.payment.pending": "Chờ thanh toán",
    "booking.payment.paid": "Đã thanh toán",
    "booking.payment.failed": "Thanh toán lỗi",
    "booking.payment.refunded": "Đã hoàn tiền",
    "booking.checkIn": "Nhận phòng",
    "booking.checkOut": "Trả phòng",
    "booking.nights": "Số đêm",
    "booking.guestRoom": "Khách/phòng",
    "booking.total": "Tổng tiền",
    "booking.booker": "Người đặt",
    "booking.viewDetail": "Xem chi tiết đơn",
  },
  en: {
    "nav.home": "Home",
    "nav.hotels": "Hotels",
    "nav.promotions": "Deals",
    "nav.about": "About",
    "nav.news": "News",
    "nav.contact": "Contact",
    "auth.login": "Sign in",
    "auth.register": "Register",
    "menu.notifications": "Notification center",
    "menu.profile": "Profile",
    "menu.favorites": "Favorite hotels",
    "menu.bookings": "Booking history",
    "menu.settings": "Account settings",
    "menu.admin": "Admin dashboard",
    "menu.logout": "Sign out",
    "menu.logoutSuccess": "Signed out successfully!",
    "search.destination": "Destination",
    "search.chooseDestination": "Choose destination",
    "search.checkIn": "Check-in",
    "search.checkOut": "Check-out",
    "search.guests": "Guests",
    "search.rooms": "Rooms",
    "search.submit": "Search",
    "hotels.all": "All hotels",
    "hotels.inCity": "Hotels in {city}",
    "hotels.filteredBy": "Results are filtered by destination, stay dates, guests and available rooms.",
    "hotels.allDestinations": "All destinations",
    "hotels.pickDates": "Choose dates for accurate availability",
    "hotels.guestCount": "{count} guests",
    "hotels.roomCount": "{count} rooms",
    "hotels.sort.popular": "Most popular",
    "hotels.sort.priceAsc": "Price low to high",
    "hotels.sort.priceDesc": "Price high to low",
    "hotels.sort.rating": "Top rated",
    "hotels.loading": "Loading hotels...",
    "hotels.emptyTitle": "No matching hotels found",
    "hotels.emptyHint": "Try widening the price range, removing filters, or changing your dates.",
    "hotels.filter": "Filters",
    "hotels.reset": "Reset",
    "hotels.price": "Price range",
    "hotels.allPrices": "All prices",
    "hotels.upTo": "Up to {price}",
    "hotels.stars": "Star rating",
    "hotels.star": "{count} stars",
    "hotels.amenities": "Amenities",
    "hotelCard.deal": "Deal",
    "hotelCard.roomTypes": "{count} room types",
    "hotelCard.reviews": "{count} reviews",
    "hotelCard.pool": "Pool",
    "hotelCard.wifi": "Wifi",
    "hotelCard.dining": "Dining",
    "hotelCard.from": "From",
    "hotelCard.perNight": "/ night",
    "room.maxGuests": "Up to {count} guests",
    "room.left": "Only {count} rooms left",
    "room.available": "{count} rooms available",
    "room.soldOut": "Sold out",
    "room.viewDetails": "View details",
    "room.select": "Select room",
    "room.pricePerNight": "Price per night",
    "settings.title": "Account settings",
    "settings.subtitle": "Update your personal details, password, and website preferences in one dedicated place.",
    "settings.backProfile": "Back to profile",
    "settings.manageProfile": "Manage your Luxury Stay profile",
    "settings.profile": "Personal details",
    "settings.profileDesc": "Name, phone number and sign-in email",
    "settings.password": "Password",
    "settings.passwordDesc": "Change or set your account password",
    "settings.preferences": "Website preferences",
    "settings.preferencesDesc": "Notifications, language, currency and display options",
    "settings.name": "Full name",
    "settings.phone": "Phone number",
    "settings.email": "Sign-in email",
    "settings.saveInfo": "Save details",
    "settings.languageCurrency": "Language and currency",
    "settings.displayOnly": "USD is for display only; payments still use the original booking amount.",
    "settings.emailDeals": "Receive deal emails",
    "settings.emailDealsDesc": "Get offers, promo codes, and destination ideas.",
    "settings.bookingReminder": "Booking reminders",
    "settings.bookingReminderDesc": "Get reminders before check-in and when booking status changes.",
    "settings.compactBookings": "Compact booking list",
    "settings.compactBookingsDesc": "Show fewer bookings on your profile for faster scanning.",
    "settings.currentPassword": "Current password",
    "settings.newPassword": "New password",
    "settings.confirmPassword": "Confirm password",
    "settings.changePassword": "Change password",
    "settings.setPassword": "Set password",
    "settings.hasPassword": "Password set",
    "settings.noPassword": "No password yet",
    "settings.loginBy": "Sign-in",
    "settings.savedProfile": "Profile updated",
    "settings.savedPassword": "Password updated",
    "profile.title": "Profile & booking history",
    "profile.subtitle": "Track bookings, manage personal details, and personalize your Luxury Stay experience.",
    "profile.personalAccount": "Personal account",
    "profile.newBooking": "New booking",
    "profile.memberOverview": "Member overview",
    "profile.spent": "Recorded spending",
    "profile.memberHint": "Complete more stays or payments to unlock better member benefits.",
    "profile.bookingDetails": "Booking history details",
    "profile.bookingDetailsDesc": "Quickly review recent bookings, payment status, stay dates and totals.",
    "profile.viewAll": "View all",
    "profile.loadingBookings": "Loading booking history...",
    "profile.noBookings": "No bookings yet",
    "profile.noBookingsHint": "Your bookings and order details will appear here after you reserve a room.",
    "profile.findHotel": "Find hotels",
    "profile.totalBookings": "Total bookings",
    "profile.activeOrders": "Active orders",
    "profile.paidOrders": "Paid orders",
    "profile.upcoming": "Upcoming",
    "booking.status.pending": "Pending",
    "booking.status.confirmed": "Confirmed",
    "booking.status.checked_in": "Checked in",
    "booking.status.checked_out": "Completed",
    "booking.status.cancelled": "Cancelled",
    "booking.payment.pending": "Payment pending",
    "booking.payment.paid": "Paid",
    "booking.payment.failed": "Payment failed",
    "booking.payment.refunded": "Refunded",
    "booking.checkIn": "Check-in",
    "booking.checkOut": "Check-out",
    "booking.nights": "Nights",
    "booking.guestRoom": "Guests/rooms",
    "booking.total": "Total",
    "booking.booker": "Booked by",
    "booking.viewDetail": "View order details",
  },
};

const readInitialPreferences = (): { language: AppLanguage; currency: AppCurrency } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        language: parsed.language === "en" ? "en" : "vi",
        currency: parsed.currency === "USD" ? "USD" : "VND",
      };
    }

    const legacy = localStorage.getItem(LEGACY_PROFILE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return {
        language: parsed.language === "en" ? "en" : "vi",
        currency: parsed.currency === "USD" ? "USD" : "VND",
      };
    }
  } catch {
    // Keep defaults when localStorage is malformed.
  }

  return { language: "vi", currency: "VND" };
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const initial = readInitialPreferences();
  const [language, setLanguageState] = useState<AppLanguage>(initial.language);
  const [currency, setCurrencyState] = useState<AppCurrency>(initial.currency);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ language, currency }));

    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || "{}");
      localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify({ ...legacy, language, currency }));
    } catch {
      localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify({ language, currency }));
    }

    document.documentElement.lang = language;
  }, [currency, language]);

  const value = useMemo<LocaleContextValue>(() => {
    const t = (key: string) => dictionary[language][key] || dictionary.vi[key] || key;
    const formatCurrency = (valueInVnd: number) => {
      const safeValue = Number(valueInVnd || 0);
      if (currency === "USD") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }).format(safeValue / VND_PER_USD);
      }

      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(safeValue);
    };

    return {
      language,
      currency,
      setLanguage: setLanguageState,
      setCurrency: setCurrencyState,
      t,
      formatCurrency,
    };
  }, [currency, language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
};

export const interpolate = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(String(value)), template);
