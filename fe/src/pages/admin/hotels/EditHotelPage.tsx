import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  MapPin, 
  Star, 
  Info, 
  CheckCircle2, 
  Plus, 
  Trash2,
  X,
  BedDouble,
  Edit,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, BASE_URL, getImageUrl } from "@/services/apiClient";
import { getPortalAccessToken } from "@/services/authSession";
import AddRoomModal from "./AddRoomModal";
import EditRoomModal from "./EditRoomModal";
import { HOTEL_AMENITY_OPTIONS } from "@/constants/hotelAmenities";
import { fetchProvinces, fetchDistricts, fetchWards, Province, District, Ward } from "@/services/locationService";
import ProvinceCombobox from "@/components/admin/ProvinceCombobox";

const EditHotelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([""]);
  const [amenityOptions, setAmenityOptions] = useState<string[]>(HOTEL_AMENITY_OPTIONS);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    district: "",
    ward: "",
    location: "",
    stars: 5,
    pricePerNight: "",
    shortDescription: "",
    description: "",
    popular: false,
    promoted: false,
  });

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const data = await apiFetch(`/hotels/${id}`);
        setFormData({
          name: data.name,
          city: data.city,
          district: data.district || "",
          ward: data.ward || "",
          location: data.location,
          stars: data.stars,
          pricePerNight: data.pricePerNight.toString(),
          shortDescription: data.shortDescription,
          description: data.description,
          popular: data.popular,
          promoted: data.promoted,
        });
        setImages(data.images.length > 0 ? data.images.map((img: any) => img.url || img) : [""]);
        
        const existingAmenities = data.amenities?.map((a: any) => a.name) || [];
        setAmenities(existingAmenities);

        // Add any existing amenities that are not in DEFAULT_AMENITY_OPTIONS to the amenityOptions
        setAmenityOptions(prev => {
           const newOptions = [...prev];
           existingAmenities.forEach((item: string) => {
              if (!newOptions.some(opt => opt.toLowerCase() === item.toLowerCase())) {
                 newOptions.push(item);
              }
           });
           return newOptions;
        });

        setRooms(data.rooms || []);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin khách sạn");
        navigate("/admin");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [id, navigate]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await fetchProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to fetch provinces", error);
      }
    };
    loadProvinces();
  }, []);

  // Effect to pre-populate districts and wards when hotel data is loaded
  useEffect(() => {
    const prePopulateLocations = async () => {
      if (!formData.city || provinces.length === 0) return;

      const province = provinces.find(p => p.name === formData.city);
      if (province) {
        try {
          const districtData = await fetchDistricts(province.code);
          setDistricts(districtData);

          if (formData.district) {
            const district = districtData.find((d: any) => d.name === formData.district);
            if (district) {
              const wardData = await fetchWards(district.code);
              setWards(wardData);
            }
          }
        } catch (error) {
          console.error("Failed to pre-populate locations", error);
        }
      }
    };
    
    prePopulateLocations();
  }, [formData.city, provinces]);

  const handleProvinceSelect = async (provinceName: string) => {
    const province = provinces.find(p => p.name === provinceName);
    
    setFormData(prev => ({ ...prev, city: provinceName, district: "", ward: "" }));
    setDistricts([]);
    setWards([]);
    
    if (province) {
      try {
        const data = await fetchDistricts(province.code);
        setDistricts(data);
      } catch (error) {
        console.error("Failed to fetch districts", error);
      }
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtName = e.target.value;
    const district = districts.find(d => d.name === districtName);
    
    setFormData(prev => ({ ...prev, district: districtName, ward: "" }));
    setWards([]);
    
    if (district) {
      try {
        const data = await fetchWards(district.code);
        setWards(data);
      } catch (error) {
        console.error("Failed to fetch wards", error);
      }
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, ward: e.target.value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkUploading(true);
    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append("files", files[i]);
    }

    try {
      const response = await fetch(`${BASE_URL}/api/upload/bulk`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getPortalAccessToken("admin") || ""}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const newUrls = data.map((item: any) => `${BASE_URL}${item.url}`);
      
      setImages(prev => {
        const current = prev.filter(img => img !== "");
        return [...current, ...newUrls];
      });
      toast.success(`Đã tải lên ${newUrls.length} ảnh thành công!`);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải nhiều ảnh.");
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getPortalAccessToken("admin") || ""}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const imageUrl = `${BASE_URL}${data.url}`;
      
      const newImages = [...images];
      newImages[index] = imageUrl;
      setImages(newImages);
      toast.success("Ảnh đã được tải lên!");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const addImageField = () => setImages([...images, ""]);
  const removeImageField = (index: number) => setImages(images.filter((_, i) => i !== index));

  const normalizeAmenity = (value: string) => value.trim();

  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const addAmenity = () => {
    const value = normalizeAmenity(newAmenity);
    if (!value) return;

    const existedInOptions = amenityOptions.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    const existedInSelected = amenities.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    if (!existedInOptions) {
      setAmenityOptions((prev) => [...prev, value]);
    }

    if (!existedInSelected) {
      setAmenities((prev) => [...prev, value]);
    }

    setNewAmenity("");
  };

  const removeAmenity = (name: string) => {
    setAmenities((prev) => prev.filter((item) => item !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiFetch(`/hotels/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...formData,
          stars: Number(formData.stars),
          pricePerNight: Number(formData.pricePerNight),
          images: images.filter(img => img !== ""),
          amenities: amenities,
        }),
      });

      toast.success("Khách sạn đã được cập nhật thành công!");
      navigate("/admin");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi cập nhật khách sạn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) {
      try {
        await apiFetch(`/hotels/${id}/rooms/${roomId}`, { method: "DELETE" });
        toast.success("Đã xóa phòng");
        setRooms(rooms.filter(r => r.id !== roomId));
      } catch (error) {
        toast.error("Không thể xóa phòng");
      }
    }
  };

  const handleRoomSuccess = async () => {
    const data = await apiFetch(`/hotels/${id}`);
    setRooms(data.rooms || []);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-20">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} id="edit-hotel-form">
          <div className="flex items-center justify-between mb-8">
            <div>
              <button 
                type="button"
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chỉnh sửa Khách Sạn</h1>
              <p className="text-gray-500 text-sm mt-1">Cập nhật thông tin chi tiết cho {formData.name}</p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              Lưu Thay Đổi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Main Info */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border">
                <div className="flex items-center gap-2 mb-6 text-blue-600">
                  <Info className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin cơ bản</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên khách sạn *</label>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Ví dụ: Vinpearl Luxury Nha Trang"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Số sao *</label>
                      <div className="relative">
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          name="stars"
                          value={formData.stars}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none bg-no-repeat"
                        >
                          {[1, 2, 3, 4, 5].map(s => (
                            <option key={s} value={s}>{s} Sao</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Giá thấp nhất (VNĐ/đêm) *</label>
                      <input
                        required
                        type="number"
                        name="pricePerNight"
                        value={formData.pricePerNight}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="500000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mô tả ngắn *</label>
                    <input
                      required
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Tóm tắt về khách sạn (1 dòng)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mô tả chi tiết *</label>
                    <textarea
                      required
                      name="description"
                      rows={8}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                      placeholder="Giới thiệu đầy đủ về không gian, dịch vụ..."
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border">
                <div className="flex items-center gap-2 mb-6 text-orange-600">
                  <ImageIcon className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bộ sưu tập hình ảnh</h2>
                </div>
                
                <div className="space-y-4">
                  {images.map((url, index) => (
                    <div key={index} className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-muted/50 rounded-2xl border border-gray-100 dark:border-border">
                      <div className="flex items-center gap-3">
                        <div className="relative group w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                          {url ? (
                            <img src={getImageUrl(url)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                          {uploadingIndex === index && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <label className="block">
                            <span className="sr-only">Choose photo</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileChange(index, e)}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                cursor-pointer
                              "
                            />
                          </label>
                          <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 dark:border-border dark:bg-muted">
                            Dữ liệu ảnh dùng file import từ máy, không nhập URL thủ công.
                          </p>
                        </div>

                        {images.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={addImageField}
                      className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:bg-blue-50 p-2 rounded-lg transition-colors border border-blue-100"
                    >
                      <Plus className="w-4 h-4" /> Thêm ô nhập
                    </button>
                    
                    <label className="flex items-center gap-2 text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 p-2 px-3 rounded-lg transition-colors cursor-pointer shadow-sm">
                      {isBulkUploading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>Tải nhiều ảnh một lúc</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBulkFileChange}
                        disabled={isBulkUploading}
                      />
                    </label>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Settings & Location */}
            <div className="space-y-8">
              <section className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border">
                <div className="flex items-center gap-2 mb-6 text-green-600">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vị trí địa lý</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tỉnh/Thành phố *</label>
                    <ProvinceCombobox
                      value={formData.city}
                      provinces={provinces}
                      onSelect={handleProvinceSelect}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quận/Huyện *</label>
                      <select
                        required
                        name="district"
                        disabled={!formData.city}
                        value={formData.district}
                        onChange={handleDistrictChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none font-semibold disabled:opacity-50"
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phường/Xã *</label>
                      <select
                        required
                        name="ward"
                        disabled={!formData.district}
                        value={formData.ward}
                        onChange={handleWardChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none font-semibold disabled:opacity-50"
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.name}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ cụ thể *</label>
                    <textarea
                      required
                      name="location"
                      rows={3}
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-medium"
                      placeholder="Số 10, đường ABC, phường X..."
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border">
                <div className="flex items-center gap-2 mb-6 text-purple-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tiện nghi & Gắn thẻ</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {amenityOptions.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-3 cursor-pointer rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={amenities.includes(item)}
                          onChange={() => toggleAmenity(item)}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl text-sm outline-none"
                      placeholder="Thêm tiện nghi khác..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAmenity();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addAmenity}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-600 p-2 rounded-xl transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((a) => (
                        <span
                          key={a}
                          className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                        >
                          {a}
                          <button type="button" onClick={() => removeAmenity(a)}>
                            <X className="w-3 h-3 hover:text-red-500" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <hr className="border-gray-100 dark:border-border" />

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="popular"
                        checked={formData.popular}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                        Đánh dấu Phổ biến
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="promoted"
                        checked={formData.promoted}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                        Đánh dấu Được đề xuất
                      </span>
                    </label>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>

        {/* Rooms Section */}
        <section className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              <BedDouble className="w-5 h-5" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quản lý các loại phòng ({rooms.length})</h2>
            </div>
            <button
               type="button"
               onClick={() => setIsAddingRoom(true)}
               className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm phòng mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {rooms.length === 0 ? (
               <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-muted/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-border">
                 Chưa có thông tin phòng cho khách sạn này. 
                 <button onClick={() => setIsAddingRoom(true)} className="text-blue-600 ml-1 font-semibold underline">Thêm ngay!</button>
               </div>
             ) : (
               rooms.map((room) => (
                <div key={room.id} className="group relative bg-gray-50 dark:bg-muted/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-border hover:shadow-lg transition-all">
                   <div className="h-40 overflow-hidden bg-gray-200">
                      <img src={getImageUrl(room.image)} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   </div>
                   <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">{room.name}</h3>
                        <div className="flex gap-1">
                            <button 
                               type="button"
                               onClick={() => setEditingRoom(room)}
                               className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                               title="Sửa"
                            >
                               <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                               type="button"
                               onClick={() => handleDeleteRoom(room.id)}
                               className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                               title="Xóa"
                            >
                               <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{room.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-border">
                         <div className="text-xs text-gray-500">
                           <span className="font-semibold text-gray-700 dark:text-gray-300">{room.maxGuests} khách</span> • {room.size}m²
                         </div>
                         <span className="text-blue-600 font-bold text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}</span>
                      </div>
                   </div>
                </div>
               ))
             )}
          </div>
        </section>

        {/* Modals */}
        {isAddingRoom && (
          <AddRoomModal 
            hotelId={id || ""} 
            hotelName={formData.name} 
            onClose={() => setIsAddingRoom(false)} 
            onSuccess={handleRoomSuccess}
          />
        )}

        {editingRoom && (
          <EditRoomModal 
            hotelId={id || ""} 
            room={editingRoom} 
            onClose={() => setEditingRoom(null)} 
            onSuccess={handleRoomSuccess}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default EditHotelPage;
