import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BedDouble,
  Building2,
  Edit,
  Eye,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import AdminLayout from "@/layouts/AdminLayout";
import { apiFetch, getImageUrl } from "@/services/apiClient";
import AddRoomModal from "../hotels/AddRoomModal";
import EditRoomModal from "../hotels/EditRoomModal";

interface Hotel {
  id: string;
  name: string;
  city?: string;
  stars?: number;
  rooms?: Room[];
}

interface Room {
  id: string;
  hotelId: string;
  name: string;
  image?: string | null;
  images?: Array<string | { url?: string }>;
  maxGuests?: number;
  price?: number | string;
  description?: string | null;
  size?: number | null;
  quantityAvailable?: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  hotelName?: string;
  hotelCity?: string;
  hotelStars?: number;
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatCurrency = (value?: number | string) =>
  `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

const getRoomImage = (room: Room) => {
  const firstImage = Array.isArray(room.images) ? room.images[0] : undefined;
  if (typeof firstImage === "string") return firstImage;
  return firstImage?.url || room.image || "";
};

const isActiveRoom = (room: Room) => room.isActive !== false && room.status !== "inactive";

const getStatusMeta = (room: Room) => {
  if (!isActiveRoom(room)) {
    return {
      label: "Đã ẩn",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    };
  }

  if (room.status === "maintenance") {
    return {
      label: "Bảo trì",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    };
  }

  if (room.status === "sold_out") {
    return {
      label: "Hết phòng",
      className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    };
  }

  return {
    label: "Đang bán",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
};

const RoomsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialHotelId = searchParams.get("hotelId") || "";
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hotelFilter, setHotelFilter] = useState(initialHotelId || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedHotelId, setSelectedHotelId] = useState(initialHotelId);
  const [addingHotel, setAddingHotel] = useState<Hotel | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const fetchHotels = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/hotels/admin/list");
      const hotelData = Array.isArray(data) ? data : [];
      setHotels(hotelData);

      if (!selectedHotelId && hotelData.length > 0) {
        setSelectedHotelId(hotelData[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách phòng từ server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (!hotels.length) return;

    const hotelId = searchParams.get("hotelId");
    const exists = hotelId && hotels.some((hotel) => hotel.id === hotelId);

    if (exists) {
      setSelectedHotelId(hotelId);
      setHotelFilter(hotelId);
      return;
    }

    if (!selectedHotelId) {
      setSelectedHotelId(hotels[0].id);
    }
  }, [hotels, searchParams, selectedHotelId]);

  const rooms = useMemo(
    () =>
      hotels.flatMap((hotel) =>
        (hotel.rooms || []).map((room) => ({
          ...room,
          hotelId: room.hotelId || hotel.id,
          hotelName: hotel.name,
          hotelCity: hotel.city,
          hotelStars: hotel.stars,
        }))
      ),
    [hotels]
  );

  const filteredRooms = useMemo(() => {
    const search = normalizeText(searchQuery.trim());

    return rooms.filter((room) => {
      const haystack = normalizeText(
        [room.name, room.hotelName, room.hotelCity, room.description].filter(Boolean).join(" ")
      );
      const matchesSearch = !search || haystack.includes(search);
      const matchesHotel = hotelFilter === "all" || room.hotelId === hotelFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActiveRoom(room)) ||
        (statusFilter === "inactive" && !isActiveRoom(room)) ||
        room.status === statusFilter;

      return matchesSearch && matchesHotel && matchesStatus;
    });
  }, [rooms, searchQuery, hotelFilter, statusFilter]);

  const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId) || null;
  const scopedRooms = useMemo(
    () => (hotelFilter === "all" ? rooms : rooms.filter((room) => room.hotelId === hotelFilter)),
    [hotelFilter, rooms]
  );
  const scopedHotel = hotelFilter === "all" ? null : hotels.find((hotel) => hotel.id === hotelFilter) || null;
  const activeRooms = scopedRooms.filter(isActiveRoom);
  const activeRoomCount = activeRooms.length;
  const hiddenRoomCount = scopedRooms.length - activeRoomCount;
  const averagePrice =
    activeRoomCount > 0
      ? activeRooms.reduce((sum, room) => sum + Number(room.price || 0), 0) / activeRoomCount
      : 0;

  const handleSelectedHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setHotelFilter(hotelId || "all");
    if (hotelId) {
      setSearchParams({ hotelId });
    } else {
      setSearchParams({});
    }
  };

  const handleHotelFilterChange = (value: string) => {
    setHotelFilter(value);
    if (value === "all") {
      setSearchParams({});
      return;
    }

    setSelectedHotelId(value);
    setSearchParams({ hotelId: value });
  };

  const handleOpenAddRoom = () => {
    if (!selectedHotel) {
      toast.error("Vui lòng chọn khách sạn trước khi thêm phòng.");
      return;
    }

    setAddingHotel(selectedHotel);
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ẩn phòng "${room.name}" khỏi hệ thống?`)) {
      return;
    }

    setDeletingRoomId(room.id);
    try {
      await apiFetch(`/hotels/${room.hotelId}/rooms/${room.id}`, { method: "DELETE" });
      toast.success("Đã ẩn phòng khỏi hệ thống. Booking cũ vẫn được giữ lại.");
      await fetchHotels();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Không thể xoá phòng.");
    } finally {
      setDeletingRoomId(null);
    }
  };

  const handleRoomSuccess = async () => {
    await fetchHotels();
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-gold">Quản trị phòng</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý phòng{scopedHotel ? ` - ${scopedHotel.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Trang con của khách sạn để thêm, chỉnh sửa và ẩn phòng.
          </p>
          <Link
            to="/admin/hotels"
            className="mt-3 inline-flex text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            Quay lại danh sách khách sạn
          </Link>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <select
            value={selectedHotelId}
            onChange={(event) => handleSelectedHotelChange(event.target.value)}
            className="h-11 min-w-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-border dark:bg-card dark:text-slate-100 sm:min-w-[260px]"
          >
            {hotels.length === 0 ? (
              <option value="">Chưa có khách sạn</option>
            ) : (
              hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            onClick={handleOpenAddRoom}
            disabled={!selectedHotel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Thêm phòng
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
            <BedDouble className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tổng số phòng</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{scopedRooms.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
            <Eye className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Đang bán</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{activeRoomCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800">
            <Trash2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Đã ẩn</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{hiddenRoomCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Giá TB đang bán</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(averagePrice)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border dark:bg-card">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-border lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm phòng, khách sạn, thành phố..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-border dark:bg-muted dark:focus:bg-card"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <select
              value={hotelFilter}
              onChange={(event) => handleHotelFilterChange(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-border dark:bg-muted"
            >
              <option value="all">Tất cả khách sạn</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-border dark:bg-muted"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Đã ẩn</option>
              <option value="maintenance">Bảo trì</option>
              <option value="sold_out">Hết phòng</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-border dark:bg-muted/50">
                <th className="px-6 py-4">Phòng</th>
                <th className="px-6 py-4">Khách sạn</th>
                <th className="px-6 py-4 text-center">Sức chứa</th>
                <th className="px-6 py-4">Giá / đêm</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-gray-500">
                    Đang tải danh sách phòng...
                  </td>
                </tr>
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map((room) => {
                  const status = getStatusMeta(room);
                  const image = getRoomImage(room);

                  return (
                    <tr
                      key={room.id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-border dark:hover:bg-muted/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-14 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-muted">
                            {image ? (
                              <img src={getImageUrl(image)} alt={room.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900 dark:text-white">{room.name}</p>
                            <p className="mt-1 line-clamp-1 max-w-[340px] text-xs text-gray-500">
                              {room.description || "Chưa có mô tả phòng"}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-gray-400">
                              {room.size ? `${room.size} m²` : "Chưa có diện tích"} · {Array.isArray(room.images) ? room.images.length : 0} ảnh
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/hotels/edit/${room.hotelId}`}
                          className="font-semibold text-slate-800 transition-colors hover:text-blue-600 dark:text-slate-100"
                        >
                          {room.hotelName}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">
                          {room.hotelCity || "Chưa có thành phố"} · {room.hotelStars || 0} sao
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Users className="h-3.5 w-3.5" />
                          {room.maxGuests || 0} khách
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-900 dark:text-white">{formatCurrency(room.price)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {room.quantityAvailable ?? 0} phòng khả dụng
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingRoom(room)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                            title="Sửa phòng"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room)}
                            disabled={deletingRoomId === room.id || !isActiveRoom(room)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/20"
                            title={isActiveRoom(room) ? "Xoá phòng" : "Phòng đã ẩn"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-muted">
                        <BedDouble className="h-6 w-6" />
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">Chưa tìm thấy phòng phù hợp</p>
                      <p className="mt-1 text-sm text-gray-500">Thử đổi bộ lọc hoặc thêm phòng mới cho khách sạn.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addingHotel && (
        <AddRoomModal
          hotelId={addingHotel.id}
          hotelName={addingHotel.name}
          onClose={() => setAddingHotel(null)}
          onSuccess={handleRoomSuccess}
        />
      )}

      {editingRoom && (
        <EditRoomModal
          hotelId={editingRoom.hotelId}
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSuccess={handleRoomSuccess}
        />
      )}
    </AdminLayout>
  );
};

export default RoomsPage;
