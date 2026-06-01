import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Building,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  MessageSquareText,
  Newspaper,
  Settings,
  TicketPercent,
  Users,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("luxstay_admin_sidebar_collapsed") === "true";
  });
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem("luxstay_admin_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const menuItems = [
    { name: "Tổng quan", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Thống kê", path: "/admin/statistics", icon: BarChart3 },
    { name: "Đơn đặt phòng", path: "/admin/bookings", icon: CalendarDays },
    { name: "Khách sạn", path: "/admin/hotels", icon: Building },
    { name: "Đánh giá", path: "/admin/reviews", icon: MessageSquareText },
    { name: "Người dùng", path: "/admin/customers", icon: Users },
    { name: "Tin tức", path: "/admin/news", icon: Newspaper },
    { name: "Ưu đãi / Voucher", path: "/admin/promotions", icon: TicketPercent },
    { name: "Liên hệ", path: "/admin/contact", icon: MessageSquare },
    { name: "Thông báo", path: "/admin/notifications", icon: Bell },
    { name: "Cài đặt", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-slate-900 selection:bg-gold/30 dark:bg-[#020617] dark:text-slate-100">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        menuItems={menuItems}
      />

      <main
        className={`relative flex min-w-0 flex-1 flex-col overflow-hidden transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sidebarCollapsed ? "md:pl-24" : "md:pl-80"
        }`}
      >
        <AdminHeader user={user} setSidebarOpen={setSidebarOpen} />

        <div className="relative flex-1 overflow-y-auto overflow-x-hidden p-8">
          <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
