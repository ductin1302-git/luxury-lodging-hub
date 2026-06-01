import { useState } from "react";
import { Building, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import NotificationBell from "@/components/notifications/NotificationBell";

interface AdminHeaderProps {
  user: any;
  setSidebarOpen: (open: boolean) => void;
}

const AdminHeader = ({ user, setSidebarOpen }: AdminHeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { enterWebsiteAsAdmin, logout } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, pagePath } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout("admin");
    toast.success("Đã đăng xuất thành công");
    navigate("/LoginAdmin/admin");
  };

  const handleOpenWebsite = () => {
    const didSwitch = enterWebsiteAsAdmin();

    if (!didSwitch) {
      toast.error("Không tìm thấy phiên đăng nhập admin.");
      return;
    }

    navigate("/");
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-slate-500 hover:text-slate-900 p-2 bg-slate-100 rounded-xl transition-all"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:block">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Hệ thống quản trị</h2>
          <p className="text-lg font-black text-slate-900 dark:text-white">Chào mừng quay trở lại!</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={handleOpenWebsite}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-gold/10 hover:text-gold transition-all border border-transparent hover:border-gold/20"
        >
          <Building className="w-4 h-4" />
          Xem Website
        </button>
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />

        <NotificationBell
          items={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          viewAllPath={pagePath}
          onOpenNotification={markAsRead}
        />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 group cursor-pointer p-1.5 pr-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-gold to-yellow-600 shadow-lg shadow-gold/20 flex items-center justify-center text-slate-950 font-black text-sm group-hover:scale-105 transition-transform">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-sm font-bold leading-tight group-hover:text-gold transition-colors">{user?.name}</span>
              <span className="text-[10px] font-bold text-gold uppercase tracking-tighter">Quản trị viên</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in duration-200">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/admin/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <User className="w-4 h-4 text-gold" /> Trang cá nhân
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gold" /> Cài đặt hệ thống
                </Link>

                <div className="my-2 border-t border-slate-100 dark:border-white/5" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
