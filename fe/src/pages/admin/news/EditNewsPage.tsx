import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import NewsImageUploader from "@/components/admin/NewsImageUploader";
import {
  getNewsArticleById,
  ManagedNewsArticle,
  newsCategories,
  updateNewsArticle,
} from "@/services/newsStore";

const EditNewsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<ManagedNewsArticle | null>(null);

  useEffect(() => {
    const article = getNewsArticleById(id);
    if (!article) {
      toast.error("Không tìm thấy bài viết.");
      navigate("/admin/news");
      return;
    }
    setForm(article);
  }, [id, navigate]);

  const handleSave = () => {
    if (!id || !form?.title.trim() || !form?.content.trim()) {
      toast.error("Vui lòng điền tiêu đề và nội dung bài viết.");
      return;
    }

    updateNewsArticle(id, { ...form, image: form.images[0] || form.image });
    toast.success("Đã cập nhật bài viết.");
    navigate("/admin/news");
  };

  if (!form) return null;

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/admin/news")} className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Chỉnh sửa bài viết</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cập nhật thông tin cho bài viết #{id}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
        <div className="p-8 space-y-6 max-w-4xl">
          <label className="block">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Tiêu đề *</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Mô tả ngắn</span>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted text-sm focus:ring-2 focus:ring-gold outline-none transition-all resize-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Nội dung chi tiết *</span>
            <textarea
              rows={12}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted text-sm focus:ring-2 focus:ring-gold outline-none transition-all resize-none"
            />
          </label>

          <NewsImageUploader
            images={form.images || (form.image ? [form.image] : [])}
            onChange={(images) => setForm({ ...form, images, image: images[0] || "" })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Tác giả</span>
                <input
                  type="text"
                  value={form.author}
                  onChange={(event) => setForm({ ...form, author: event.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Danh mục</span>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                >
                  {newsCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Trạng thái</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as "published" | "draft" })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-xl bg-gray-50 dark:bg-muted text-sm focus:ring-2 focus:ring-gold outline-none transition-all"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Xuất bản</option>
                </select>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-border flex justify-end gap-3">
            <button onClick={() => navigate("/admin/news")} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-muted rounded-xl transition-colors">
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditNewsPage;
