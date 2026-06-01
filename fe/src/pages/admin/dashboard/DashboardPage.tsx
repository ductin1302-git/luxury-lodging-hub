import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch } from "@/services/apiClient";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Users as UsersIcon, Building, ArrowUpRight, ArrowDownRight,
  Filter, Download, Bell, Zap, Plus, Activity, 
  ShieldCheck, Info, Sparkles
} from "lucide-react";

// Mock data for charts
const initialMonthlyRevenue = [
  { name: "Th 1", revenue: 45000000 },
  { name: "Th 2", revenue: 52000000 },
  { name: "Th 3", revenue: 48000000 },
  { name: "Th 4", revenue: 61000000 },
  { name: "Th 5", revenue: 55000000 },
  { name: "Th 6", revenue: 67000000 },
  { name: "Th 7", revenue: 89000000 },
];

const initialBookingStatus = [
  { name: "Hoàn thành", value: 450, color: "#10b981" },
  { name: "Chờ xử lý", value: 120, color: "#f59e0b" },
  { name: "Đã hủy", value: 80, color: "#ef4444" },
  { name: "Lưu trú", value: 150, color: "#3b82f6" },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    hotels: 0, 
    users: 0, 
    bookings: 850, 
    revenue: 417000000 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [revenueData, setRevenueData] = useState(initialMonthlyRevenue);
  const [statusData, setStatusData] = useState(initialBookingStatus);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Live Pulse Effect for charts
    const pulseTimer = setInterval(() => {
      setRevenueData(prev => prev.map(item => ({
        ...item,
        revenue: item.revenue + (Math.random() * 1000000 - 500000)
      })));
    }, 3000);

    const fetchStats = async () => {
      try {
        const [hotelsData, usersData, bookingStats] = await Promise.all([
          apiFetch("/hotels").catch(() => []),
          apiFetch("/users").catch(() => []),
          apiFetch("/bookings/stats").catch(() => ({ total: 0, revenue: 0, confirmed: 0 })),
        ]);
        setStats({ 
          hotels: hotelsData.length || 0, 
          users: usersData.length || 0,
          bookings: bookingStats.total || 0,
          revenue: bookingStats.revenue || 0
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
    return () => {
      clearInterval(timer);
      clearInterval(pulseTimer);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AdminLayout>
      {/* Dynamic Welcome Hero */}
      <div className="relative mb-10 p-8 rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-gold rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-500 rounded-full blur-[100px] opacity-50"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Hệ thống đang hoạt động
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Chào buổi sáng, <span className="text-gold">Admin</span>
            </h1>
            <p className="text-slate-400 max-w-lg">
              Hôm nay là {currentTime.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. 
              Mọi hệ thống đang vận hành ở mức tối ưu.
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right duration-700">
             <div className="text-right hidden sm:block">
               <p className="text-2xl font-mono font-bold text-white tracking-widest">
                 {currentTime.toLocaleTimeString("vi-VN")}
               </p>
               <p className="text-xs text-slate-500 font-bold uppercase">Thời gian thực tế</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gold shadow-inner">
                <Bell className="w-6 h-6 animate-bounce" />
             </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Doanh thu", value: formatCurrency(stats.revenue), icon: DollarSign, trend: "+12.5%", isUp: true, color: "gold", note: "Tổng thu nhập từ các đơn confirmed", path: "/admin/statistics" },
          { label: "Đặt phòng", value: stats.bookings, icon: Calendar, trend: "+8.2%", isUp: true, color: "blue", note: "Lượng đơn hàng mới trong chu kỳ", path: "/admin/bookings" },
          { label: "Người dùng", value: stats.users, icon: UsersIcon, trend: "-2.4%", isUp: false, color: "emerald", note: "Số lượng tài khoản khách hàng thực", path: "/admin/customers" },
          { label: "Cơ sở lưu trú", value: stats.hotels, icon: Building, trend: "Active", isUp: true, color: "orange", note: "Các khách sạn đang kinh doanh", path: "/admin" },
        ].map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(item.path)}
            className="group relative bg-white dark:bg-card p-6 rounded-2xl border border-gray-200 dark:border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${item.color === 'gold' ? 'yellow' : item.color}-50 dark:bg-${item.color === 'gold' ? 'yellow' : item.color}-900/20 text-${item.color === 'gold' ? 'yellow' : item.color}-600`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${item.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {item.trend}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-gray-500 font-medium text-xs mb-1">
                {item.label}
                <div className="group/info relative">
                  <Info className="w-3 h-3 cursor-help opacity-40" />
                  <div className="absolute bottom-full left-0 mb-2 w-40 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.note}
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{item.value}</p>
            </div>
            {/* Hover Decorator */}
            <div className={`absolute bottom-0 left-0 h-1 bg-${item.color === 'gold' ? 'yellow' : item.color}-500 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
        {/* Main Chart Area */}
        <div className="lg:col-span-3 space-y-8">
           {/* Revenue Chart */}
           <div 
             onClick={() => navigate("/admin/statistics")}
             className="bg-white dark:bg-card p-8 rounded-3xl border border-border shadow-sm cursor-pointer hover:border-gold/30 transition-all"
           >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-black text-xl tracking-tight italic uppercase">Xu hướng tăng trưởng</h3>
                  <p className="text-sm text-gray-400">Phân tích dòng tiền hàng tháng</p>
                </div>
                <div className="flex bg-gray-50 dark:bg-muted p-1 rounded-xl">
                  {['Tuần', 'Tháng', 'Năm'].map(t => (
                    <button key={t} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${t === 'Tháng' ? 'bg-white dark:bg-card shadow-sm text-gold' : 'text-gray-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `${v/1000000}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
                      formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Quick Actions Zone */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Đăng tin tức", icon: Plus, color: "bg-blue-600", path: "/admin/news/new" },
                { label: "Thêm khách sạn", icon: Zap, color: "bg-purple-600", path: "/admin/hotels/new" },
                { label: "Kiểm tra đơn", icon: Activity, color: "bg-emerald-600", path: "/admin/bookings" },
                { label: "Bảo mật", icon: ShieldCheck, color: "bg-slate-800", path: "/admin/settings" },
              ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-card border border-border rounded-2xl hover:border-gold/50 hover:shadow-lg transition-all group"
                >
                   <div className={`w-12 h-12 rounded-xl ${action.color} text-white flex items-center justify-center mb-3 shadow-lg transition-transform group-hover:scale-110`}>
                      <action.icon className="w-6 h-6" />
                   </div>
                   <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{action.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
           {/* Pie Chart Card */}
           <div 
             onClick={() => navigate("/admin/bookings")}
             className="bg-white dark:bg-card p-6 rounded-3xl border border-border shadow-sm cursor-pointer hover:border-gold/30 transition-all"
           >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 tracking-tight uppercase italic">
                Trạng thái vận hành
              </h3>
              <div className="h-[220px] w-full rotate-slow">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}}></div>
                       <span className="text-xs text-gray-500 font-medium">{s.name}</span>
                    </div>
                    <span className="text-xs font-black">{s.value}</span>
                  </div>
                ))}
              </div>
           </div>

           {/* System Log / Timeline */}
           <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Activity className="w-16 h-16 animate-pulse" />
              </div>
              <h3 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-400">Hoạt động hệ thống</h3>
              <div className="space-y-6 relative">
                 <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-800"></div>
                 {[
                   { msg: "Yêu cầu thanh toán mới", time: "2 phút trước", color: "bg-gold" },
                   { msg: "Cập nhật giá phòng Nha Trang", time: "15 phút trước", color: "bg-blue-500" },
                   { msg: "Sao lưu cơ sở dữ liệu thành công", time: "1 giờ trước", color: "bg-emerald-500" },
                 ].map((log, i) => (
                   <div key={i} className="flex gap-4 relative z-10">
                      <div className={`w-4 h-4 rounded-full ${log.color} ring-4 ring-slate-900 shrink-0`}></div>
                      <div>
                        <p className="text-xs font-bold">{log.msg}</p>
                        <p className="text-[10px] text-slate-500">{log.time}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <button className="w-full mt-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest">
                 Kiểm tra nhật ký
              </button>
           </div>
        </div>
      </div>
      <style>{`
        @keyframes slow-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .rotate-slow {
          animation: slow-rotate 30s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 3s;
        }
      `}</style>
    </AdminLayout>
  );
};

export default DashboardPage;
