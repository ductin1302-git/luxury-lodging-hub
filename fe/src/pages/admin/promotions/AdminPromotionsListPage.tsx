import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Filter,
  Image as ImageIcon,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Search,
  TicketPercent,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch, BASE_URL, getImageUrl } from "@/services/apiClient";
import { getPortalAccessToken } from "@/services/authSession";

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description?: string;
  imageUrl?: string;
  discountType: "percent" | "amount";
  discountValue: number;
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

const emptyForm = {
  code: "",
  title: "",
  description: "",
  imageUrl: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  isActive: true,
};

type PromoLifecycle = "available" | "ending" | "upcoming" | "expired" | "inactive";

const DAY_MS = 24 * 60 * 60 * 1000;

const getStartOfDay = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getPromoLifecycle = (promo: Promotion): PromoLifecycle => {
  const today = getStartOfDay().getTime();
  const startTime = promo.startDate ? getStartOfDay(promo.startDate).getTime() : null;
  const endTime = promo.endDate ? getStartOfDay(promo.endDate).getTime() : null;

  if (endTime !== null && endTime < today) return "expired";
  if (!promo.isActive) return "inactive";
  if (startTime !== null && startTime > today) return "upcoming";
  if (endTime !== null && endTime - today <= 7 * DAY_MS) return "ending";
  return "available";
};

const getDaysUntilEnd = (promo: Promotion) => {
  if (!promo.endDate) return null;
  return Math.ceil((getStartOfDay(promo.endDate).getTime() - getStartOfDay().getTime()) / DAY_MS);
};

const lifecycleMeta: Record<PromoLifecycle, { label: string; hint: string; badge: string; dot: string }> = {
  available: {
    label: "Đang mở",
    hint: "Khách có thể dùng",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  ending: {
    label: "Sắp hết hạn",
    hint: "Cần theo dõi",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  upcoming: {
    label: "Sắp diễn ra",
    hint: "Chưa áp dụng",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  expired: {
    label: "Hết hạn",
    hint: "Tự đóng",
    badge: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    dot: "bg-red-500",
  },
  inactive: {
    label: "Đã đóng",
    hint: "Tạm ngưng",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
};

import { Pagination } from "@/components/common/Pagination";

export default function AdminPromotionsListPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(val || 0));

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/promotions?page=${page}&limit=10`);
      setPromotions(Array.isArray(res.data) ? res.data : []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Không thể tải danh sách voucher");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [page]);

  const filteredPromotions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return promotions.filter((promo) => {
      const lifecycle = getPromoLifecycle(promo);
      const matchesSearch =
        !keyword ||
        promo.code?.toLowerCase().includes(keyword) ||
        promo.title?.toLowerCase().includes(keyword) ||
        promo.description?.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && (lifecycle === "available" || lifecycle === "ending")) ||
        statusFilter === lifecycle ||
        (statusFilter === "closed" && (lifecycle === "inactive" || lifecycle === "expired"));
      return matchesSearch && matchesStatus;
    });
  }, [promotions, searchTerm, statusFilter]);

  const lifecycleCounts = useMemo(
    () =>
      promotions.reduce(
        (counts, promo) => {
          counts[getPromoLifecycle(promo)] += 1;
          return counts;
        },
        {
          available: 0,
          ending: 0,
          upcoming: 0,
          expired: 0,
          inactive: 0,
        } as Record<PromoLifecycle, number>,
      ),
    [promotions],
  );

  const availableCount = lifecycleCounts.available + lifecycleCounts.ending;
  const closedCount = lifecycleCounts.expired + lifecycleCounts.inactive;

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingPromotion(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      code: promo.code || "",
      title: promo.title || "",
      description: promo.description || "",
      imageUrl: promo.imageUrl || "",
      discountType: promo.discountType || "percent",
      discountValue: String(promo.discountValue || ""),
      minOrderAmount: promo.minOrderAmount ? String(promo.minOrderAmount) : "",
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 10) : "",
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 10) : "",
      usageLimit: promo.usageLimit ? String(promo.usageLimit) : "",
      isActive: promo.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/api/promotions/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getPortalAccessToken("admin") || ""}`,
        },
        body: uploadData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success("Đã tải ảnh voucher");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải ảnh voucher");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.code.trim() || !formData.title.trim() || !formData.discountValue) {
      toast.error("Vui lòng nhập mã, tên và mức giảm giá");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiFetch(editingPromotion ? `/promotions/${editingPromotion.id}` : "/promotions", {
        method: editingPromotion ? "PUT" : "POST",
        body: JSON.stringify(formData),
      });
      toast.success(editingPromotion ? "Đã cập nhật voucher" : "Đã thêm voucher");
      closeModal();
      fetchPromotions();
    } catch (error: any) {
      toast.error(error?.message || "Không thể lưu voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    const lifecycle = getPromoLifecycle(promo);
    if (!promo.isActive && lifecycle === "expired") {
      toast.error("Voucher đã hết hạn, hãy sửa ngày kết thúc trước khi mở lại");
      return;
    }

    try {
      await apiFetch(`/promotions/${promo.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      toast.success(promo.isActive ? "Đã đóng voucher" : "Đã mở voucher");
      fetchPromotions();
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật trạng thái voucher");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
    try {
      await apiFetch(`/promotions/${id}`, { method: "DELETE" });
      toast.success("Đã xóa voucher");
      fetchPromotions();
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa voucher");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TicketPercent className="w-8 h-8 text-gold" />
              Quản lý ưu đãi & voucher
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thêm, sửa, đóng/mở và xóa các mã giảm giá trên hệ thống.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-gold hover:bg-yellow-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-gold/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Thêm voucher
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng voucher</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{promotions.length}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Khả dụng</p>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{availableCount}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sắp hết hạn</p>
            <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{lifecycleCounts.ending}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đã đóng / hết hạn</p>
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{closedCount}</h3>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên voucher..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Đang dùng được</option>
              <option value="ending">Sắp hết hạn</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="closed">Đã đóng / hết hạn</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Ảnh / Mã</th>
                  <th className="px-6 py-4 font-semibold">Chương trình</th>
                  <th className="px-6 py-4 font-semibold">Giảm giá</th>
                  <th className="px-6 py-4 font-semibold">Đã dùng</th>
                  <th className="px-6 py-4 font-semibold">Thời gian</th>
                  <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-gold mx-auto mb-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredPromotions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Chưa có voucher phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredPromotions.map((promo) => {
                    const lifecycle = getPromoLifecycle(promo);
                    const meta = lifecycleMeta[lifecycle];
                    const daysLeft = getDaysUntilEnd(promo);

                    return (
                    <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                            {promo.imageUrl ? (
                              <img src={getImageUrl(promo.imageUrl)} alt={promo.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <TicketPercent className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gold/10 text-gold border border-gold/20">
                            {promo.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{promo.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: {promo.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gold">
                          {promo.discountType === "percent" ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
                        </span>
                        {Number(promo.minOrderAmount || 0) > 0 && (
                          <p className="text-xs text-slate-400">Tối thiểu {formatCurrency(Number(promo.minOrderAmount))}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {promo.usedCount || 0} / {promo.usageLimit || "không giới hạn"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <div>{promo.startDate ? new Date(promo.startDate).toLocaleDateString("vi-VN") : "Vô thời hạn"}</div>
                        <div className="text-slate-400">
                          {promo.endDate ? `đến ${new Date(promo.endDate).toLocaleDateString("vi-VN")}` : ""}
                        </div>
                        {daysLeft !== null && lifecycle === "ending" && (
                          <div className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Còn {daysLeft} ngày</div>
                        )}
                        {lifecycle === "expired" && (
                          <div className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">Đã quá hạn</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-400">{meta.hint}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(promo)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Sửa voucher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(promo)}
                            className="p-2 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                            title={promo.isActive ? "Đóng voucher" : "Mở voucher"}
                          >
                            {promo.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Xóa voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && meta.totalPages > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <Pagination
                currentPage={page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TicketPercent className="w-6 h-6 text-gold" />
                  {editingPromotion ? "Chỉnh sửa voucher" : "Thêm voucher mới"}
                </h2>
                <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gold" />
                    Hình ảnh voucher
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-700 relative">
                      {formData.imageUrl ? (
                        <img src={getImageUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Upload className="w-6 h-6" />
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-4 h-4" />
                        Import ảnh voucher
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                      </label>
                      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Chỉ dùng ảnh import từ máy để dữ liệu hiển thị ổn định trên website.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mã voucher *</span>
                    <input
                      required
                      type="text"
                      value={formData.code}
                      onChange={(event) => setFormData({ ...formData, code: event.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none uppercase font-bold"
                      placeholder="SUMMER2026"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên chương trình *</span>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                      placeholder="Khuyến mãi mùa hè"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Loại giảm giá</span>
                    <select
                      value={formData.discountType}
                      onChange={(event) => setFormData({ ...formData, discountType: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                    >
                      <option value="percent">Giảm theo %</option>
                      <option value="amount">Giảm tiền cố định</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mức giảm *</span>
                    <input
                      required
                      type="number"
                      value={formData.discountValue}
                      onChange={(event) => setFormData({ ...formData, discountValue: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none font-bold"
                      placeholder="15 hoac 500000"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày bắt đầu</span>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày kết thúc</span>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(event) => setFormData({ ...formData, endDate: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Đơn tối thiểu</span>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(event) => setFormData({ ...formData, minOrderAmount: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                      placeholder="1000000"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Giới hạn lượt dùng</span>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(event) => setFormData({ ...formData, usageLimit: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                      placeholder="Để trống nếu không giới hạn"
                    />
                  </label>
                  <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                      className="accent-gold"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Voucher đang hoạt động</span>
                  </label>
                  <label className="md:col-span-2 space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</span>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none resize-none"
                      placeholder="Ghi chú cho voucher..."
                    />
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 font-bold text-slate-950 bg-gold hover:bg-yellow-500 rounded-xl shadow-lg shadow-gold/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {editingPromotion ? "Cập nhật" : "Lưu voucher"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
