import React, { useState, useEffect } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { 
  User as UserIcon, Mail, Phone, Shield, Camera, 
  Lock, Save, Key, Clock, Globe,
  MapPin, Edit3, CheckCircle2, AlertCircle,
  Activity, Fingerprint, LogOut, Loader2,
  X, Eye, EyeOff
} from "lucide-react";

const AdminProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "Đà Nẵng, Việt Nam",
    bio: "Quản trị viên hệ thống Luxury Stay Hotel."
  });

  // Password change state
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name,
        email: user.email,
        phone: user.phone || ""
      }));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await authService.updateProfile({
        name: formData.fullName,
        phone: formData.phone
      });
      updateProfile({
        name: formData.fullName,
        phone: formData.phone
      });
      toast.success("Hồ sơ đã được cập nhật thành công!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error("Mật khẩu mới không khớp!");
    }
    if (passData.newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
    }

    setIsChangingPass(true);
    try {
      await authService.changePassword({
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword
      });
      toast.success("Đổi mật khẩu thành công!");
      setShowPasswordModal(false);
      setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      const errorMsg = error.message || "Lỗi khi đổi mật khẩu. Vui lòng thử lại.";
      toast.error(errorMsg);
      // Optional: focus back to old password field
      setPassData(prev => ({ ...prev, oldPassword: "" }));
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            {/* Header Card */}
            <div className="bg-white dark:bg-card rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-2xl relative">
               <div className="h-48 w-full bg-gradient-to-br from-slate-900 via-blue-900 to-gold/20 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute top-6 right-6">
                     <button className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold hover:bg-white/20 transition-all">
                        <Camera className="w-4 h-4" /> Thay ảnh bìa
                     </button>
                  </div>
               </div>

               <div className="px-10 pb-10">
                  <div className="relative flex flex-col md:flex-row items-end gap-6 -mt-16">
                     <div className="relative group">
                        <div className="w-36 h-36 rounded-[2.5rem] bg-white dark:bg-slate-900 p-1.5 shadow-2xl relative z-10">
                           <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-br from-gold via-yellow-600 to-yellow-700 flex items-center justify-center text-5xl font-black text-white shadow-inner transform transition-transform group-hover:scale-105 duration-500">
                              {formData.fullName?.[0]?.toUpperCase() || "A"}
                           </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 z-20">
                           <button className="p-3 bg-white dark:bg-slate-800 text-gold rounded-2xl shadow-xl border-4 border-slate-50 dark:border-slate-900 hover:rotate-12 transition-all">
                              <Camera className="w-5 h-5" />
                           </button>
                        </div>
                     </div>

                     <div className="flex-1 space-y-2 mb-2 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                           <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formData.fullName}</h1>
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                           </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                           <Shield className="w-4 h-4 text-gold" /> Quản trị viên hệ thống cao cấp
                        </p>
                     </div>
                  </div>

                  <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-8 text-center md:text-left">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cấp bậc</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter italic">
                           Root Admin
                        </p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tham gia</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Tháng 4, 2026</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Trạng thái</p>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-emerald-500">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Đang hoạt động
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Profile Info Fields */}
            <div className="bg-white dark:bg-card rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-10 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-gold rounded-full"></div>
                     Hồ sơ chi tiết
                  </h3>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isSaving}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isEditing ? 'bg-slate-100 text-slate-600' : 'bg-gold text-white shadow-lg shadow-gold/20 hover:scale-105'
                    }`}
                  >
                    {isEditing ? <AlertCircle className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    {isEditing ? 'Hủy bỏ' : 'Chỉnh sửa'}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 text-gold">
                           <UserIcon className="w-4 h-4" />
                        </div>
                        <input 
                          type="text" 
                          disabled={!isEditing || isSaving}
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-muted border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold transition-all disabled:opacity-60"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Cố định)</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 text-slate-300">
                           <Mail className="w-4 h-4" />
                        </div>
                        <input 
                          type="email" 
                          disabled={true}
                          value={formData.email}
                          className="w-full pl-14 pr-4 py-4 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-medium opacity-60 cursor-not-allowed"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 text-gold">
                           <Phone className="w-4 h-4" />
                        </div>
                        <input 
                          type="text" 
                          disabled={!isEditing || isSaving}
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-muted border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold transition-all disabled:opacity-60"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khu vực</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 text-gold">
                           <Globe className="w-4 h-4" />
                        </div>
                        <input 
                          type="text" 
                          disabled={!isEditing || isSaving}
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-muted border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold transition-all disabled:opacity-60"
                        />
                     </div>
                  </div>
               </div>

               {isEditing && (
                  <div className="mt-10 flex justify-end">
                     <button 
                       onClick={handleSave}
                       disabled={isSaving}
                       className="flex items-center gap-3 bg-slate-900 dark:bg-gold text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-2xl transition-all disabled:opacity-50"
                     >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Đang lưu..." : "Cập nhật hồ sơ ngay"}
                     </button>
                  </div>
               )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gold mb-10 flex items-center gap-2">
                   <Lock className="w-4 h-4" /> Trung tâm bảo mật
                </h3>
                
                <div className="space-y-6">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-gold/20 text-gold rounded-2xl flex items-center justify-center">
                            <Fingerprint className="w-6 h-6" />
                         </div>
                         <div>
                            <p className="text-sm font-bold">Xác thực sinh trắc</p>
                            <p className="text-[10px] text-slate-400">Đã kích hoạt bảo vệ</p>
                         </div>
                      </div>
                      <button className="w-full py-2.5 bg-gold text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                         Quản lý mã PIN
                      </button>
                   </div>

                   <button 
                     onClick={() => setShowPasswordModal(true)}
                     className="w-full flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group"
                   >
                      <div className="flex items-center gap-4">
                         <Key className="w-5 h-5 text-gold group-hover:rotate-45 transition-transform" />
                         <span className="text-sm font-bold">Đổi mật khẩu</span>
                      </div>
                      <Edit3 className="w-4 h-4 text-slate-500" />
                   </button>
                </div>
             </div>

             <div className="bg-white dark:bg-card rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-10 shadow-sm relative">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                   <Activity className="w-4 h-4 text-gold" /> Nhật ký vận hành
                </h3>
                
                <div className="space-y-8 relative">
                   <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-white/5"></div>
                   
                   {[
                     { action: "Cập nhật thông tin cá nhân", time: "Vừa xong", type: "success" },
                     { action: "Chốt báo cáo tháng 5", time: "2 giờ trước", type: "info" },
                     { action: "Xác minh 5 khách hàng mới", time: "5 giờ trước", type: "success" },
                   ].map((log, i) => (
                     <div key={i} className="flex gap-6 relative z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                           log.type === 'success' ? 'bg-emerald-500 text-white' : 
                           log.type === 'warning' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                           <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{log.action}</p>
                           <p className="text-[10px] text-slate-400 mt-1 font-medium">{log.time}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                 <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-gold rounded-full"></div>
                    Đổi mật khẩu
                 </h2>
                 <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                    <div className="relative">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                       <input 
                         type={showPass ? "text" : "password"}
                         required
                         value={passData.oldPassword}
                         onChange={(e) => setPassData({...passData, oldPassword: e.target.value})}
                         className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-muted border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                         placeholder="••••••••"
                       />
                       <button 
                         type="button" 
                         onClick={() => setShowPass(!showPass)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold transition-colors"
                       >
                         {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                    <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                       <input 
                         type={showPass ? "text" : "password"}
                         required
                         value={passData.newPassword}
                         onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                         className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-muted border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                         placeholder="Tối thiểu 6 ký tự"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                       <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                       <input 
                         type={showPass ? "text" : "password"}
                         required
                         value={passData.confirmPassword}
                         onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                         className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-muted border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                         placeholder="Nhập lại mật khẩu mới"
                       />
                    </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={isChangingPass}
                   className="w-full bg-slate-900 dark:bg-gold text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                    {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isChangingPass ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                 </button>
              </form>
           </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProfilePage;
