import { Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, type ChangeEvent } from "react";

import { BASE_URL, getImageUrl } from "@/services/apiClient";
import { getPortalAccessToken } from "@/services/authSession";

type NewsImageUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

const NewsImageUploader = ({ images, onChange }: NewsImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const uploadData = new FormData();
    files.forEach((file) => uploadData.append("files", file));

    try {
      setIsUploading(true);
      const response = await fetch(`${BASE_URL}/api/upload/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getPortalAccessToken("admin") || ""}`,
        },
        body: uploadData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const uploaded = await response.json();
      const urls = Array.isArray(uploaded) ? uploaded.map((item) => item.url).filter(Boolean) : [];
      onChange([...images, ...urls]);
      toast.success("Đã import ảnh bài viết");
    } catch (error) {
      console.error(error);
      toast.error("Không thể import ảnh bài viết");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = (image: string) => {
    onChange(images.filter((item) => item !== image));
  };

  const setCover = (image: string) => {
    onChange([image, ...images.filter((item) => item !== image)]);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-border dark:bg-muted">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Ảnh bài viết</p>
          <p className="mt-1 text-xs text-gray-500">Import một hoặc nhiều ảnh, ảnh đầu tiên sẽ là ảnh đại diện.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-gold/20 transition-all hover:bg-gold/90 active:scale-95">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Import ảnh
          <input type="file" accept="image/*" multiple onChange={uploadFiles} className="hidden" disabled={isUploading} />
        </label>
      </div>

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-xl border border-white bg-white shadow-sm dark:border-border dark:bg-card">
              <img src={getImageUrl(image)} alt={`News ${index + 1}`} className="h-32 w-full object-cover" />
              <div className="absolute inset-x-2 top-2 flex justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setCover(image)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-gold shadow-sm"
                  title="Đặt làm ảnh đại diện"
                >
                  <Star className={`h-4 w-4 ${index === 0 ? "fill-current" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(image)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-red-500 shadow-sm"
                  title="Xóa ảnh"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-full bg-gold px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  Đại diện
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex min-h-36 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm font-medium text-gray-400 dark:border-border dark:bg-card">
          Chưa import ảnh nào
        </div>
      )}
    </div>
  );
};

export default NewsImageUploader;
