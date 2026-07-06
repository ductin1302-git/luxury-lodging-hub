import React, { useState } from "react";
import { X, Plus, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, BASE_URL, getImageUrl } from "@/services/apiClient";
import { getPortalAccessToken } from "@/services/authSession";

interface EditRoomModalProps {
  hotelId: string;
  room: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({ hotelId, room, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: room.name || "",
    maxGuests: room.maxGuests || 2,
    price: room.price || 0,
    description: room.description || "",
    size: room.size || 30,
    quantityAvailable: room.quantityAvailable || 1,
  });
  
  const [images, setImages] = useState<string[]>(
    room.images && room.images.length > 0 
      ? room.images.map((img: any) => img.url || img) 
      : (room.image ? [room.image] : [""])
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getPortalAccessToken("admin") || ""}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const imageUrl = `${BASE_URL}${data.url}`;
      
      const newImages = [...images];
      newImages[index] = imageUrl;
      setImages(newImages);
      toast.success("Ảnh đã được tải lên!");
    } catch (error) {
      toast.error("Không thể tải ảnh lên.");
    } finally {
      setUploadingIndex(null);
    }
  };

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
      toast.success(`Đã tải lên ${newUrls.length} ảnh!`);
    } catch (error) {
      toast.error("Lỗi khi tải nhiều ảnh.");
    } finally {
      setIsBulkUploading(false);
    }
  };

  const addImageField = () => setImages([...images, ""]);
  const removeImageField = (index: number) => setImages(images.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch(`/hotels/${hotelId}/rooms/${room.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...formData,
          maxGuests: Number(formData.maxGuests),
          price: Number(formData.price),
          size: Number(formData.size),
          quantityAvailable: Number(formData.quantityAvailable),
          images: images.filter(img => img !== ""),
          image: images.filter(img => img !== "")[0] || null,
        }),
      });
      toast.success("Cập nhật phòng thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Lỗi khi cập nhật phòng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-border">
          <h2 className="text-xl font-bold">Chỉnh sửa phòng</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Tên phòng *</label>
                <input 
                  required 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Giá/đêm *</label>
                  <input 
                    required 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Diện tích (m²) *</label>
                  <input 
                    required 
                    type="number" 
                    name="size" 
                    value={formData.size} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số khách tối đa *</label>
                <input 
                  required 
                  type="number" 
                  name="maxGuests" 
                  value={formData.maxGuests} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Tổng số lượng phòng *</label>
                <input 
                  required 
                  type="number" 
                  name="quantityAvailable" 
                  value={formData.quantityAvailable} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Mô tả *</label>
                <textarea 
                  required 
                  rows={4}
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hình ảnh ({images.filter(i => i).length})</label>
                <label className="flex items-center gap-1.5 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold cursor-pointer hover:bg-blue-100 transition-colors">
                  {isBulkUploading ? <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div> : <Upload className="w-3 h-3" />}
                  TẢI NHIỀU ẢNH
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleBulkFileChange} disabled={isBulkUploading} />
                </label>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {images.map((url, index) => (
                  <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-muted/50 rounded-xl border border-gray-100 dark:border-border">
                    <div className="flex items-center gap-2">
                       <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          {url ? (
                            <img src={getImageUrl(url)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          {uploadingIndex === index && (
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             </div>
                          )}
                       </div>
                       <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(index, e)}
                            className="hidden"
                            id={`file-room-edit-${index}`}
                          />
                          <label htmlFor={`file-room-edit-${index}`} className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline mb-1 block uppercase">Thay đổi</label>
                          <p className="rounded-lg border border-gray-200 bg-white p-2 text-[10px] font-medium text-gray-500 dark:border-border dark:bg-muted">
                            Chỉ import ảnh từ máy.
                          </p>
                       </div>
                       <button 
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 dark:border-border rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all font-medium"
                >
                  <Plus className="w-4 h-4" /> Thêm hàng
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-border">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomModal;
