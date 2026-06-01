import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/common/sonner";
import { Toaster } from "@/components/common/toaster";
import { TooltipProvider } from "@/components/common/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

// client pages
import HomePage from "@/pages/client/HomePage";
import HotelsPage from "@/pages/client/HotelsPage";
import HotelDetailPage from "@/pages/client/HotelDetailPage";
import HotelReviewsPage from "@/pages/client/HotelReviewsPage";
import RoomDetailPage from "@/pages/client/RoomDetailPage";
import BookingPage from "@/pages/client/BookingPage";
import PaymentPage from "@/pages/client/PaymentPage";
import MyBookingsPage from "@/pages/client/MyBookingsPage";
import ProfilePage from "@/pages/client/ProfilePage";
import AccountSettingsPage from "@/pages/client/AccountSettingsPage";
import FavoriteHotelsPage from "@/pages/client/FavoriteHotelsPage";
import BookingHistoryPage from "@/pages/client/BookingHistoryPage";
import ClientBookingDetailPage from "@/pages/client/BookingDetailPage";
import PromotionsPage from "@/pages/client/PromotionsPage";
import NewsPage from "@/pages/client/NewsPage";
import NewsDetailPage from "@/pages/client/NewsDetailPage";
import ContactPage from "@/pages/client/ContactPage";
import AboutPage from "@/pages/client/AboutPage";
import NotificationsPage from "@/pages/client/NotificationsPage";
import SupportMessageDetailPage from "@/pages/client/SupportMessageDetailPage";

// auth pages
import LoginPage from "@/pages/auth/LoginPage";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";
import CompleteProfilePage from "@/pages/auth/CompleteProfilePage";

// admin pages
import AdminHotelsPage from "@/pages/admin/hotels/HotelsPage";
import AddHotelPage from "@/pages/admin/hotels/AddHotelPage";
import EditHotelPage from "@/pages/admin/hotels/EditHotelPage";
import RoomsPage from "@/pages/admin/rooms/RoomsPage";
import DashboardPage from "@/pages/admin/dashboard/DashboardPage";
import SalesStatisticsPage from "@/pages/admin/statistics/SalesStatisticsPage";
import CustomersPage from "@/pages/admin/customers/CustomersPage";
import BookingListPage from "@/pages/admin/bookings/BookingListPage";
import BookingDetailPage from "@/pages/admin/bookings/BookingDetailPage";
import AdminReviewsPage from "@/pages/admin/reviews/AdminReviewsPage";
import NewsListPage from "@/pages/admin/news/NewsListPage";
import AddNewsPage from "@/pages/admin/news/AddNewsPage";
import EditNewsPage from "@/pages/admin/news/EditNewsPage";
import AdminNewsDetailPage from "@/pages/admin/news/NewsDetailPage";
import AdminPromotionsListPage from "@/pages/admin/promotions/AdminPromotionsListPage";
import ContactListPage from "@/pages/admin/contact/ContactListPage";
import ContactDetailPage from "@/pages/admin/contact/ContactDetailPage";
import SettingsPage from "@/pages/admin/settings/SettingsPage";
import AdminProfilePage from "@/pages/admin/profile/AdminProfilePage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminNotificationsPage from "@/pages/admin/notifications/AdminNotificationsPage";

import NotFound from "@/pages/NotFound";

import ScrollToTop from "@/components/layout/ScrollToTop";
import EntryLoader from "@/components/layout/EntryLoader";
import AiSupportWidget from "@/components/ai/AiSupportWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <LocaleProvider>
          <EntryLoader />
          <AuthProvider>
            <NotificationProvider>
              <BookingProvider>
                <Toaster />
                <Sonner />
                <ScrollToTop />
                <AiSupportWidget />
                <Routes>
              {/* --- PUBLIC ROUTES --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/hotels" element={<HotelsPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:id" element={<NewsDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/hotel/:id" element={<HotelDetailPage />} />
              <Route path="/hotel/:id/reviews" element={<HotelReviewsPage />} />
              <Route path="/hotel/:id/rooms/:roomId" element={<RoomDetailPage />} />
              
              {/* --- AUTH ROUTES --- */}
              <Route path="/auth" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* --- PROTECTED USER ROUTES --- */}
              <Route
                path="/booking"
                element={<ProtectedRoute><BookingPage /></ProtectedRoute>}
              />
              <Route
                path="/payment"
                element={<ProtectedRoute><PaymentPage /></ProtectedRoute>}
              />
              <Route
                path="/booking-success"
                element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>}
              />
              <Route
                path="/my-bookings"
                element={<ProtectedRoute><BookingHistoryPage /></ProtectedRoute>}
              />
              <Route
                path="/my-bookings/:id"
                element={<ProtectedRoute><ClientBookingDetailPage /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
              />
              <Route
                path="/settings"
                element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>}
              />
              <Route
                path="/favorites"
                element={<ProtectedRoute><FavoriteHotelsPage /></ProtectedRoute>}
              />
              <Route
                path="/notifications"
                element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
              />
              <Route
                path="/support/messages/:id"
                element={<ProtectedRoute><SupportMessageDetailPage /></ProtectedRoute>}
              />
              <Route
                path="/complete-profile"
                element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>}
              />

              {/* --- ADMIN ROUTES --- */}
              <Route path="/admin" element={<AdminRoute><AdminHotelsPage /></AdminRoute>} />
              <Route path="/admin/hotels" element={<AdminRoute><AdminHotelsPage /></AdminRoute>} />
              <Route path="/admin/hotels/new" element={<AdminRoute><AddHotelPage /></AdminRoute>} />
              <Route path="/admin/hotels/edit/:id" element={<AdminRoute><EditHotelPage /></AdminRoute>} />
              <Route path="/admin/rooms" element={<AdminRoute><RoomsPage /></AdminRoute>} />
              <Route path="/admin/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
              <Route path="/admin/statistics" element={<AdminRoute><SalesStatisticsPage /></AdminRoute>} />
              <Route path="/admin/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
              <Route path="/admin/bookings" element={<AdminRoute><BookingListPage /></AdminRoute>} />
              <Route path="/admin/bookings/view/:id" element={<AdminRoute><BookingDetailPage /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviewsPage /></AdminRoute>} />
              <Route path="/admin/news" element={<AdminRoute><NewsListPage /></AdminRoute>} />
              <Route path="/admin/news/new" element={<AdminRoute><AddNewsPage /></AdminRoute>} />
              <Route path="/admin/news/edit/:id" element={<AdminRoute><EditNewsPage /></AdminRoute>} />
              <Route path="/admin/news/view/:id" element={<AdminRoute><AdminNewsDetailPage /></AdminRoute>} />
              <Route path="/admin/promotions" element={<AdminRoute><AdminPromotionsListPage /></AdminRoute>} />
              <Route path="/admin/contact" element={<AdminRoute><ContactListPage /></AdminRoute>} />
              <Route path="/admin/contact/view/:id" element={<AdminRoute><ContactDetailPage /></AdminRoute>} />
              <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationsPage /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              <Route path="/admin/profile" element={<AdminRoute><AdminProfilePage /></AdminRoute>} />
              <Route path="/LoginAdmin/admin" element={<AdminLoginPage />} />

              {/* --- 404 NOT FOUND --- */}
              <Route path="*" element={<NotFound />} />
                </Routes>
              </BookingProvider>
            </NotificationProvider>
          </AuthProvider>
        </LocaleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
