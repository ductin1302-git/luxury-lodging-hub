import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Search, Tag, User, X } from "lucide-react";

import ScrollReveal from "@/components/common/ScrollReveal";
import NewsHero from "@/components/home/NewsHero";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLocale } from "@/contexts/LocaleContext";
import { getImageUrl } from "@/services/apiClient";
import { getPublishedNewsArticles, localizeNewsArticles } from "@/services/newsStore";

const normalizeSearchText = (value: unknown) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ");

const NewsPage = () => {
  const { language } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");

  const blogs = useMemo(
    () => localizeNewsArticles(getPublishedNewsArticles(), language),
    [language],
  );

  const filteredBlogs = useMemo(() => {
    const keyword = normalizeSearchText(searchQuery);
    if (!keyword) return blogs;

    return blogs.filter((blog) => {
      const searchableText = normalizeSearchText(
        [
          blog.title,
          blog.excerpt,
          stripHtml(blog.content || ""),
          blog.category,
          blog.author,
          ...(blog.tags || []),
        ].join(" "),
      );

      return searchableText.includes(keyword);
    });
  }, [blogs, searchQuery]);

  const copy =
    language === "en"
      ? {
          readMore: "Read more",
          searchTitle: "Search news",
          searchPlaceholder: "Enter keywords...",
          clearSearch: "Clear search",
          resultUnit: "articles found",
          noResultsTitle: "No articles found",
          noResultsDesc: "Try another keyword, category or destination name.",
          recent: "Latest articles",
          tags: "Popular tags",
          tagList: ["Travel", "Resort", "Deals", "Nha Trang", "Phu Quoc", "Luxury", "Spa", "Dining"],
        }
      : {
          readMore: "Đọc tiếp",
          searchTitle: "Tìm kiếm tin tức",
          searchPlaceholder: "Nhập từ khóa...",
          clearSearch: "Xóa tìm kiếm",
          resultUnit: "bài viết phù hợp",
          noResultsTitle: "Không tìm thấy bài viết",
          noResultsDesc: "Thử nhập từ khóa khác, danh mục khác hoặc tên điểm đến.",
          recent: "Bài viết mới nhất",
          tags: "Từ khóa phổ biến",
          tagList: ["Du lịch", "Resort", "Ưu đãi", "Nha Trang", "Phú Quốc", "Luxury", "Spa", "Ẩm thực"],
        };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <NewsHero />

      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="lg:w-2/3">
            <ScrollReveal direction="up">
              <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-heading text-2xl font-bold text-slate-950 dark:text-white">
                    {copy.searchTitle}
                  </h2>
                  <span className="w-fit rounded-full bg-gold/10 px-4 py-2 text-xs font-bold text-gold">
                    {filteredBlogs.length} {copy.resultUnit}
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    data-testid="news-search-input"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-12 text-sm font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-gold focus:bg-white dark:border-border dark:bg-muted dark:focus:bg-card"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={copy.clearSearch}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {filteredBlogs.map((blog, i) => (
                <ScrollReveal key={blog.id} delay={((i % 2) + 1) as any} direction="up">
                  <article
                    data-news-article
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:shadow-xl dark:border-border dark:bg-card"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={getImageUrl(blog.image)}
                        alt={blog.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute left-4 top-4">
                        <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-lg">
                          {blog.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {blog.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> {blog.author}
                        </span>
                      </div>

                      <h3 className="mb-3 line-clamp-2 text-xl font-bold transition-colors group-hover:text-gold">
                        {blog.title}
                      </h3>

                      <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-500">
                        {blog.excerpt}
                      </p>

                      <Link
                        to={`/news/${blog.id}`}
                        className="group/btn flex items-center gap-2 text-sm font-bold text-gold transition-all duration-300 hover:gap-3"
                      >
                        {copy.readMore}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>

            {!filteredBlogs.length && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm dark:border-border dark:bg-card">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                  {copy.noResultsTitle}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {copy.noResultsDesc}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-6 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-primary transition hover:bg-gold/90"
                >
                  {copy.clearSearch}
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-12 lg:w-1/3">
            <ScrollReveal direction="right">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-border dark:bg-card">
                <h4 className="mb-4 font-bold">{copy.searchTitle}</h4>
                <div className="relative">
                  <input
                    data-testid="news-sidebar-search-input"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 outline-none transition-colors focus:border-gold dark:border-border dark:bg-muted"
                  />
                  <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 dark:border-border dark:bg-card">
                <h4 className="mb-6 flex items-center gap-2 font-bold">
                  <Clock className="h-5 w-5 text-gold" /> {copy.recent}
                </h4>
                <div className="space-y-6">
                  {blogs.slice(0, 3).map((blog) => (
                    <Link key={blog.id} to={`/news/${blog.id}`} className="group flex cursor-pointer gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                        <img
                          src={getImageUrl(blog.image)}
                          alt={blog.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div>
                        <h5 className="mb-1 line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-gold">
                          {blog.title}
                        </h5>
                        <span className="text-[10px] font-bold uppercase text-gray-500">{blog.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 dark:border-border dark:bg-card">
                <h4 className="mb-6 flex items-center gap-2 font-bold">
                  <Tag className="h-5 w-5 text-gold" /> {copy.tags}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {copy.tagList.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gold hover:text-primary dark:bg-muted dark:text-gray-400"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NewsPage;
