import { Link, useLocation } from "react-router-dom";
import { X, MoreHorizontal } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  menuItems: any[];
}

const AdminSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  menuItems,
}: AdminSidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden bg-[#0a254a] text-white shadow-[10px_0_40px_rgba(0,0,0,0.1)] border-r border-white/5 transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 ${sidebarCollapsed ? "md:w-24" : "md:w-80"}`}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="h-full flex flex-col relative z-10">
        <div className={`h-24 flex items-center justify-between overflow-hidden ${sidebarCollapsed ? "px-4 md:justify-center" : "px-7"}`}>
          <Link
            to="/admin/dashboard"
            className={`flex min-w-0 items-center gap-3.5 group ${sidebarCollapsed ? "md:justify-center" : ""}`}
            title="Luxury Stay Admin"
          >
            <BrandLogo className="h-12 w-12 transform transition-transform group-hover:rotate-6 group-hover:scale-110" />
            <div className={`flex min-w-0 flex-col overflow-hidden transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarCollapsed ? "md:max-w-0 md:opacity-0 md:-translate-x-2" : "max-w-[180px] opacity-100 translate-x-0"}`}>
              <span className="font-serif text-xl font-bold text-white leading-none tracking-tight">Luxury Stay</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold/60 font-black mt-1.5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                Admin Panel
              </span>
            </div>
          </Link>
          <button
            className="md:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className={`flex-1 space-y-2 overflow-y-auto overflow-x-hidden py-6 no-scrollbar ${sidebarCollapsed ? "px-3" : "px-4"}`}>
          <div className={`mb-4 flex items-center ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-3"}`}>
            <p className={`overflow-hidden whitespace-nowrap text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              sidebarCollapsed ? "md:max-w-0 md:opacity-0 md:-translate-x-2" : "max-w-[190px] opacity-100 translate-x-0"
            }`}>
              Danh mục chính
            </p>
            <button
              type="button"
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-all hover:border-gold/40 hover:bg-gold/10 hover:text-gold md:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Mở rộng danh mục" : "Thu gọn danh mục"}
              title={sidebarCollapsed ? "Mở rộng danh mục" : "Thu gọn danh mục"}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.name}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex min-w-0 items-center overflow-hidden rounded-2xl transition-all duration-300 ${
                  sidebarCollapsed ? "justify-center px-0 py-3.5" : "gap-4 px-4 py-3.5"
                } ${isActive
                  ? "bg-gradient-to-r from-gold/20 to-transparent text-gold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                )}
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-gold" : "text-white/40 group-hover:text-white"}`} />
                <span className={`overflow-hidden whitespace-nowrap font-medium tracking-wide transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  sidebarCollapsed ? "md:max-w-0 md:opacity-0 md:translate-x-2" : "max-w-[200px] opacity-100 translate-x-0"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto h-6" />
      </div>
    </aside>
  );
};

export default AdminSidebar;
