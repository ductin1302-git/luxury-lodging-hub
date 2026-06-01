import React, { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { 
  User, 
  Settings as SettingsIcon, 
  Lock, 
  Bell, 
  Globe, 
  Palette, 
  ShieldCheck, 
  Mail, 
  Smartphone,
  Save,
  Image as ImageIcon,
  Camera,
  X
} from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Cài đặt chung", icon: SettingsIcon },
    { id: "profile", label: "Hồ sơ cá nhân", icon: User },
    { id: "security", label: "Bảo mật", icon: Lock },
    { id: "notifications", label: "Thông báo", icon: Bell },
  ];

  const handleSave = () => {
    toast.success("Đã lưu thay đổi thành công!");
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Cài đặt hệ thống</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Quản lý cấu hình website và tài khoản quản trị của bạn
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
            <nav className="p-2 flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gold text-white shadow-lg shadow-gold/20"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-muted"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <button 
                onClick={handleSave}
                className="inline-flex items-center gap-2 bg-gold text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 active:scale-95"
              >
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </button>
            </div>

            <div className="p-8">
              {activeTab === "general" && (
                <div className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Tên website</label>
                      <input 
                        type="text" 
                        defaultValue="Luxury Stay Hotel"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Mô tả website (SEO)</label>
                      <textarea 
                        rows={3}
                        defaultValue="Luxury Stay Hotel mang đến trải nghiệm lưu trú đẳng cấp thế giới, nơi mỗi chi tiết đều được chăm chút tỉ mỉ."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Email liên hệ</label>
                        <input 
                          type="email" 
                          defaultValue="contact@luxurystay.com"
                          className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Số điện thoại</label>
                        <input 
                          type="text" 
                          defaultValue="+84 28 3888 9999"
                          className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Logo website</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-muted flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-border">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <button className="px-4 py-2 text-xs font-bold border border-gray-200 dark:border-border rounded-xl hover:bg-gray-50 dark:hover:bg-muted transition-all">
                          Thay đổi logo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-8 max-w-2xl">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center text-gold text-3xl font-bold border-4 border-white dark:border-card shadow-xl">
                        A
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-gold text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Admin Account</h3>
                      <p className="text-sm text-gray-500">Quản trị viên hệ thống</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Họ và tên</label>
                      <input 
                        type="text" 
                        defaultValue="Luxury Admin"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Tên người dùng</label>
                      <input 
                        type="text" 
                        defaultValue="admin_luxury"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Email</label>
                      <input 
                        type="email" 
                        defaultValue="admin@luxurystay.com"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 border border-blue-100 dark:border-blue-900/20 mb-6">
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Lần thay đổi mật khẩu gần nhất là 30 ngày trước. Bạn nên thay đổi định kỳ để bảo mật tốt hơn.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Mật khẩu hiện tại</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: "book", label: "Đơn đặt phòng mới", desc: "Nhận thông báo khi có khách hàng đặt phòng mới", icon: Mail },
                      { id: "cancel", label: "Yêu cầu hủy phòng", desc: "Thông báo khi khách hàng yêu cầu hủy đơn", icon: X },
                      { id: "msg", label: "Tin nhắn liên hệ", desc: "Thông báo khi có khách hàng gửi tin nhắn mới", icon: Mail },
                      { id: "system", label: "Cảnh báo hệ thống", desc: "Nhận thông báo về bảo trì hoặc lỗi hệ thống", icon: Smartphone },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-muted/30 transition-all border border-transparent hover:border-gray-100 dark:hover:border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{item.label}</h4>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gold"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
