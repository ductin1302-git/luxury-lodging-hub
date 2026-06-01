import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";
import {
  Calendar,
  Edit3,
  Eye,
  FileText,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import {
  deleteNewsArticle,
  getNewsArticles,
  ManagedNewsArticle,
  newsCategories,
  toggleNewsStatus,
} from "@/services/newsStore";
import { getImageUrl } from "@/services/apiClient";

export type NewsArticle = ManagedNewsArticle;
export const categories = newsCategories;
export const defaultArticles = getNewsArticles();

const NewsListPage = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const loadArticles = () => {
    setArticles(getNewsArticles());
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    deleteNewsArticle(id);
    loadArticles();
    toast.success("Đã xóa bài viết.");
  };

  const handleToggleStatus = (id: string) => {
    toggleNewsStatus(id);
    loadArticles();
    toast.success("Đã cập nhật trạng thái bài viết.");
  };

  const filteredArticles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return articles.filter((article) => {
      const matchSearch =
        !keyword ||
        article.title.toLowerCase().includes(keyword) ||
        article.author.toLowerCase().includes(keyword) ||
        article.category.toLowerCase().includes(keyword);
      const matchCategory = filterCategory === "all" || article.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [articles, filterCategory, searchQuery]);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Danh sách tin tức</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Thêm, sửa, xóa và ẩn/hiện bài viết trên website.
          </p>
        </div>
        <Link
          to="/admin/news/new"
          className="inline-flex items-center gap-2 bg-gold text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Thêm bài viết
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-card rounded-xl p-5 border border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{articles.length}</p>
              <p className="text-xs text-gray-500">Tổng bài viết</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-5 border border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {articles.filter((article) => article.status === "published").length}
              </p>
              <p className="text-xs text-gray-500">Đã xuất bản</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-5 border border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {articles.filter((article) => article.status === "draft").length}
              </p>
              <p className="text-xs text-gray-500">Bản nháp</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-border flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none transition-all"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-muted focus:ring-2 focus:ring-gold outline-none"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3 font-medium">Bài viết</th>
                <th className="px-6 py-3 font-medium">Danh mục</th>
                <th className="px-6 py-3 font-medium">Tác giả</th>
                <th className="px-6 py-3 font-medium">Ngày đăng</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 max-w-xs">
                        <img
                          src={getImageUrl(article.image)}
                          alt={article.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{article.title}</p>
                          <p className="text-xs text-gray-500 truncate">{article.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Tag className="w-3 h-3" />
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <User className="w-3.5 h-3.5" />
                        {article.author || "Admin"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(article.id)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          article.status === "published"
                            ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {article.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/news/view/${article.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/news/edit/${article.id}`}
                          className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy bài viết nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewsListPage;
