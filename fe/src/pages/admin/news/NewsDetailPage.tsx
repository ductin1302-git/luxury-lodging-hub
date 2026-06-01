import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Edit3, ExternalLink } from "lucide-react";
import { getNewsArticleById, ManagedNewsArticle } from "@/services/newsStore";
import { getImageUrl } from "@/services/apiClient";

const NewsDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState<ManagedNewsArticle | null>(null);

  useEffect(() => {
    const found = getNewsArticleById(id);
    if (!found) {
      toast.error("Không tìm thấy bài viết.");
      navigate("/admin/news");
      return;
    }
    setArticle(found);
  }, [id, navigate]);

  if (!article) return null;

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/news")} className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Chi tiết bài viết</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Xem trước nội dung hiển thị trên website</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/news/edit/${article.id}`}
            className="inline-flex items-center gap-2 bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-700 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-muted transition-all shadow-sm active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            Chỉnh sửa
          </Link>
          {article.status === "published" && (
            <Link
              to={`/news/${article.id}`}
              className="inline-flex items-center gap-2 bg-gold text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Xem trên web
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl bg-slate-100">
          <img src={getImageUrl(article.image)} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-gold text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                {article.category}
              </span>
              <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${article.status === "published" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}>
                {article.status === "published" ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">{article.title}</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-border">
          {article.images?.length > 1 && (
            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {article.images.map((image, index) => (
                <div key={`${image}-${index}`} className="h-28 overflow-hidden rounded-2xl border border-gray-100 dark:border-border">
                  <img src={getImageUrl(image)} alt={`${article.title} ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 pb-8 mb-8 border-b border-gray-100 dark:border-border">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Tác giả</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{article.author || "Admin"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Ngày đăng</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{article.date}</p>
              </div>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium italic mb-8 leading-relaxed">
              {article.excerpt}
            </p>
            <div
              className="text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br />") }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewsDetailPage;
