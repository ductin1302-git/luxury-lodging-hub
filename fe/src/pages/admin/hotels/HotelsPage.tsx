import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Search, Star, MapPin, BedDouble, Hotel as HotelIcon } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, getImageUrl } from "@/services/apiClient";
import { Pagination } from "@/components/common/Pagination";

interface Hotel {
  id: string;
  name: string;
  city?: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  stars: number;
  images: any[];
  rooms?: any[];
  availableRoomCount?: number;
}

const getHotelCover = (hotel: Hotel) => {
  const images = Array.isArray(hotel.images) ? hotel.images : [];
  return images[0] || "";
};

const getActiveRoomCount = (hotel: Hotel) => {
  if (typeof hotel.availableRoomCount === "number") {
    return hotel.availableRoomCount;
  }
  return (hotel.rooms || []).filter((room) => room?.isActive !== false && room?.status !== "inactive").length;
};

const HotelsPage = () => {
  const navigate = useNavigate();
  const [hotelList, setHotelList] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingHotelId, setDeletingHotelId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const fetchHotels = useCallback(async (currentPage: number, search: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "10",
      });
      if (search.trim()) {
        params.append("q", search.trim());
      }

      const res = await apiFetch(`/hotels/admin/list?${params.toString()}`);

      // Handle both { data, meta } and plain array responses (backward compat)
      if (res && typeof res === "object" && Array.isArray(res.data)) {
        setHotelList(res.data);
        if (res.meta) setMeta(res.meta);
      } else if (Array.isArray(res)) {
        setHotelList(res);
        setMeta({ total: res.length, totalPages: 1, limit: 10 });
      } else {
        setHotelList([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu khách sạn từ Server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search: wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch when page or committed searchQuery changes
  useEffect(() => {
    fetchHotels(page, searchQuery);
  }, [page, searchQuery, fetchHotels]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá khách sạn này?")) {
      try {
        setDeletingHotelId(id);
        await apiFetch(`/hotels/${id}`, { method: "DELETE" });
        toast.success("Đã ẩn khách sạn khỏi hệ thống. Dữ liệu booking vẫn được giữ lại.");
        fetchHotels(page, searchQuery);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Lỗi khi xoá khách sạn");
      } finally {
        setDeletingHotelId(null);
      }
    }
  };

  const openRoomManager = (hotelId: string) => {
    navigate(`/admin/rooms?hotelId=${hotelId}`);
  };

  const start = meta.total === 0 ? 0 : (page - 1) * meta.limit + 1;
  const end = Math.min(page * meta.limit, meta.total);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Quản lý Khách sạn</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Danh sách các khách sạn đang hoạt động trên hệ thống</p>
      </div>
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo tên, thành phố, địa điểm..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Link
            to="/admin/hotels/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" /> Thêm mới
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3 font-medium">Khách Sạn</th>
                <th className="px-6 py-3 font-medium">Địa điểm</th>
                <th className="px-6 py-3 font-medium text-center">Phòng</th>
                <th className="px-6 py-3 font-medium border-none">Giá / Đêm</th>
                <th className="px-6 py-3 font-medium text-center">Đánh giá</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Đang tải dữ liệu từ Server...
                  </td>
                </tr>
              ) : hotelList.length > 0 ? (
                hotelList.map((hotel) => (
                  <tr key={hotel.id} className="border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(getHotelCover(hotel))}
                          alt={hotel.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{hotel.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            {hotel.stars} <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {hotel.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => openRoomManager(hotel.id)}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 transition-colors hover:bg-blue-200 hover:text-blue-900 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        title="Quản lý phòng của khách sạn"
                      >
                        {getActiveRoomCount(hotel)} phòng
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {Number(hotel.pricePerNight).toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {Number(hotel.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-1">{hotel.reviewCount} đánh giá</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openRoomManager(hotel.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Quản lý phòng"
                        >
                          <BedDouble className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/hotels/edit/${hotel.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hotel.id)}
                          disabled={deletingHotelId === hotel.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <HotelIcon className="w-10 h-10 opacity-30" />
                      <div>
                        <p className="font-medium text-gray-600 dark:text-gray-300">
                          {searchQuery.trim()
                            ? `Không tìm thấy khách sạn phù hợp với "${searchQuery}"`
                            : "Chưa có khách sạn nào"}
                        </p>
                        {searchQuery.trim() && (
                          <p className="text-sm mt-1 text-gray-400">
                            Thử tìm với từ khóa khác hoặc kiểm tra lại tên thành phố
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 dark:bg-muted/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {meta.total > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{start}–{end}</span>
                  {" "}/ {" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{meta.total}</span>{" "}
                  khách sạn
                </>
              ) : (
                "Không có kết quả"
              )}
              {searchQuery.trim() && (
                <span className="ml-1 text-blue-600 dark:text-blue-400">
                  {" "}cho "<strong>{searchQuery}</strong>"
                </span>
              )}
            </p>
            {meta.totalPages > 0 && (
              <Pagination
                currentPage={page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HotelsPage;
