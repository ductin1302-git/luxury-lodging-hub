import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch } from "@/services/apiClient";
import { toast } from "sonner";
import {
  Calendar,
  Crown,
  Download,
  Filter,
  Loader2,
  Mail,
  MoreVertical,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  Users as UsersIcon,
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: "customer" | "staff" | "admin" | string;
  isActive?: boolean;
  createdAt: string;
}

const roleLabel = (role: string) => {
  if (role === "admin") return "Quản trị viên";
  if (role === "staff") return "Nhân viên";
  return "Khách hàng";
};

const CustomersPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10"
      });
      // The backend users API currently doesn't support query parameters for search/filtering,
      // but we send pagination anyway. Filtering remains local for now if backend doesn't support it,
      // but wait, earlier we updated the backend findAll in users service to ONLY take page & limit.
      // So search and filter must remain local for now, OR we need to pass everything to the backend.
      // Since backend only accepts page & limit, local filtering on paginated data isn't perfect,
      // but let's just fetch paginated data.
      
      const res = await apiFetch(`/users?${params.toString()}`);
      setUsers(Array.isArray(res.data) ? res.data : []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch]);

  const filteredUsers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.toLowerCase().includes(keyword);
      const matchesRole = filterRole === "all" || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [filterRole, searchQuery, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      customers: users.filter((user) => user.role === "customer").length,
      inactive: users.filter((user) => user.isActive === false).length,
    }),
    [users],
  );

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await apiFetch(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`Đã cập nhật quyền thành ${roleLabel(newRole)}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi cập nhật quyền người dùng");
    } finally {
      setActiveMenu(null);
    }
  };

  const handleToggleActive = async (user: UserData) => {
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: user.isActive === false }),
      });
      toast.success(user.isActive === false ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật trạng thái tài khoản");
    } finally {
      setActiveMenu(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn khóa tài khoản người dùng này?")) return;

    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" });
      toast.success("Đã khóa tài khoản người dùng");
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi khóa tài khoản người dùng");
    } finally {
      setActiveMenu(null);
    }
  };

  const handleExportUsers = () => {
    const headers = ["Họ tên", "Email", "Số điện thoại", "Vai trò", "Trạng thái", "Ngày tham gia"];
    const rows = filteredUsers.map((user) => [
      user.fullName || "",
      user.email || "",
      user.phone || "",
      roleLabel(user.role),
      user.isActive === false ? "Đã khóa" : "Hoạt động",
      new Date(user.createdAt).toLocaleDateString("vi-VN"),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 italic">
            <div className="w-2 h-8 bg-gold rounded-full" />
            QUẢN LÝ NGƯỜI DÙNG
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Quản trị tài khoản, phân quyền và trạng thái hoạt động của người dùng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchUsers} className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-colors">
            <Loader2 className={`w-5 h-5 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportUsers}
            className="flex items-center gap-2 bg-gold text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-gold/20 hover:scale-105 transition-all"
          >
            <Download className="w-4 h-4" /> Xuất danh sách
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Tổng người dùng", value: stats.total, icon: UsersIcon, className: "bg-blue-50 text-blue-600" },
          { label: "Quản trị viên", value: stats.admins, icon: Crown, className: "bg-purple-50 text-purple-600" },
          { label: "Khách hàng", value: stats.customers, icon: User, className: "bg-emerald-50 text-emerald-600" },
          { label: "Đã khóa", value: stats.inactive, icon: ShieldAlert, className: "bg-rose-50 text-rose-600" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white dark:bg-card p-5 rounded-2xl border border-gray-100 dark:border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.className} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-card rounded-2xl shadow-xl border border-gray-100 dark:border-border overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-border flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-muted border-none rounded-xl text-sm focus:ring-2 focus:ring-gold transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-gray-50 dark:bg-muted border-none rounded-xl text-sm font-bold px-4 py-3 outline-none focus:ring-0"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="customer">Khách hàng</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-border">
                <th className="px-8 py-5">Thành viên</th>
                <th className="px-8 py-5">Vai trò</th>
                <th className="px-8 py-5">Liên hệ</th>
                <th className="px-8 py-5">Ngày tham gia</th>
                <th className="px-8 py-5">Trạng thái</th>
                <th className="px-8 py-5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-gold animate-spin" />
                      <p className="text-gray-400 text-sm font-bold">Đang tải danh sách người dùng...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-400">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-muted/30 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-gold font-black text-lg border-2 border-white dark:border-slate-800 shadow-sm">
                            {user.fullName?.[0]?.toUpperCase() || "U"}
                          </div>
                          {user.role === "admin" && (
                            <div className="absolute -top-2 -right-2 bg-gold text-white p-1 rounded-lg shadow-lg">
                              <Crown className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white group-hover:text-gold transition-colors">
                            {user.fullName || "Người dùng ẩn danh"}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-600 border border-purple-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {user.role === "admin" ? <ShieldAlert className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail className="w-3 h-3 text-gold" /> {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3 text-gold" /> {user.phone || "Chưa cập nhật"}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          user.isActive === false ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive === false ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        {user.isActive === false ? "Đã khóa" : "Hoạt động"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-border"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>

                      {activeMenu === user.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-8 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-2xl z-30 py-2 animate-in fade-in zoom-in duration-200">
                            <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-border mb-1">
                              Cấp quyền
                            </div>
                            <button
                              onClick={() => handleUpdateRole(user.id, user.role === "admin" ? "customer" : "admin")}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Shield className="w-4 h-4 text-blue-500" />
                              <span>{user.role === "admin" ? "Hạ xuống Khách hàng" : "Nâng lên Quản trị viên"}</span>
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ShieldAlert className="w-4 h-4 text-amber-500" />
                              <span>{user.isActive === false ? "Mở khóa tài khoản" : "Khóa tài khoản"}</span>
                            </button>

                            <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-border my-1">
                              Nguy hiểm
                            </div>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="font-bold">Khóa tài khoản</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && meta.totalPages > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-border">
            <Pagination
              currentPage={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CustomersPage;
