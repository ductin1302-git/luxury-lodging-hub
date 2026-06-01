import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/common/ScrollReveal";
import { getPublishedNewsArticles, localizeNewsArticles } from "@/services/newsStore";
import { useLocale } from "@/contexts/LocaleContext";
import { getImageUrl } from "@/services/apiClient";
import { 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  ChevronLeft, 
  Share2, 
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  Bookmark
} from "lucide-react";

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLocale();
  const blogs = localizeNewsArticles(getPublishedNewsArticles(), language);
  const blog = blogs.find(b => b.id === String(id));
  const copy =
    language === "en"
      ? {
          notFound: "Article not found",
          backNews: "Back to news",
          backList: "Back to list",
          author: "Author",
          tags: "Tags:",
          related: "Related news",
          subscribe: "Subscribe",
          subscribeDesc: "Do not miss our latest offers and events.",
          emailPlaceholder: "Your email...",
          subscribeNow: "Subscribe now",
        }
      : {
          notFound: "Không tìm thấy bài viết",
          backNews: "Quay lại tin tức",
          backList: "Quay lại danh sách",
          author: "Tác giả",
          tags: "Từ khóa:",
          related: "Tin tức liên quan",
          subscribe: "Đăng ký nhận tin",
          subscribeDesc: "Đừng bỏ lỡ các ưu đãi và sự kiện mới nhất.",
          emailPlaceholder: "Email của bạn...",
          subscribeNow: "Đăng ký ngay",
        };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{copy.notFound}</h2>
          <button 
            onClick={() => navigate("/news")}
            className="px-6 py-3 bg-gold text-primary rounded-xl font-bold hover:scale-105 transition-transform"
          >
            {copy.backNews}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const recentPosts = blogs.filter(b => b.id !== blog.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="pt-24 pb-12 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="down">
            <Link 
              to="/news" 
              className="inline-flex items-center gap-2 text-slate-500 hover:text-gold transition-colors font-bold text-sm mb-8"
            >
              <ChevronLeft className="w-4 h-4" /> {copy.backList}
            </Link>
            
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-gold/10 text-gold px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  {blog.category}
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> {blog.date}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 mb-8 leading-tight">
                {blog.title}
              </h1>

              <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-gold/20">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author}`} alt="Author" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">{copy.author}</p>
                    <p className="text-slate-900 font-black">{blog.author}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-2.5 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 rounded-full bg-slate-50 text-slate-400 hover:bg-sky-50 hover:text-sky-500 transition-all">
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <div className="py-16 container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Article content */}
          <div className="lg:w-2/3">
            <ScrollReveal>
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
                <img src={getImageUrl(blog.image)} alt={blog.title} className="w-full h-auto object-cover max-h-[500px]" />
              </div>

              {blog.images?.length > 1 && (
                <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {blog.images.slice(1).map((image, index) => (
                    <div key={`${image}-${index}`} className="h-40 overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
                      <img src={getImageUrl(image)} alt={`${blog.title} ${index + 2}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div 
                className="prose prose-slate prose-lg max-w-none 
                prose-headings:font-serif prose-headings:font-black prose-headings:text-slate-900
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium
                prose-strong:text-slate-900 prose-strong:font-black
                prose-img:rounded-3xl prose-img:shadow-lg"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              <div className="mt-16 pt-10 border-t border-slate-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-slate-400 text-sm font-bold mr-2">{copy.tags.toUpperCase()}</span>
                  {blog.tags.map(tag => (
                    <span key={tag} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-gold hover:text-primary transition-colors cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-1/3 space-y-12">
            <ScrollReveal direction="right">
              {/* Sidebar Recent Posts */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm sticky top-28">
                <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <div className="w-1 h-6 bg-gold rounded-full" />
                  {copy.related}
                </h4>
                
                <div className="space-y-8">
                  {recentPosts.map(post => (
                    <Link key={post.id} to={`/news/${post.id}`} className="flex gap-5 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                        <img src={getImageUrl(post.image)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-gold transition-colors leading-snug mb-2">
                          {post.title}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <Calendar className="w-3 h-3" /> {post.date}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-slate-900 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10">
                    <h5 className="text-white font-black mb-2 text-lg">{copy.subscribe}</h5>
                    <p className="text-slate-400 text-xs mb-6">{copy.subscribeDesc}</p>
                    <div className="space-y-3">
                      <input 
                        placeholder={copy.emailPlaceholder}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl outline-none text-white text-sm focus:border-gold transition-colors"
                      />
                      <button className="w-full py-3 bg-gold text-primary font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-transform">
                        {copy.subscribeNow}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NewsDetailPage;
