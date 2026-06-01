import { blogs } from "@/data/news";

export type NewsStatus = "published" | "draft";

export interface ManagedNewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  images: string[];
  date: string;
  author: string;
  category: string;
  tags: string[];
  status: NewsStatus;
}

const STORAGE_KEY = "luxstay_news_articles";

export const newsCategories = ["Du Lich", "Am Thuc", "Su Kien", "Suc Khoe", "Kien Truc", "Khuyen Mai"];

const defaultArticles: ManagedNewsArticle[] = blogs.map((blog) => ({
  id: String(blog.id),
  title: blog.title,
  excerpt: blog.excerpt,
  content: blog.content,
  image: blog.image,
  images: [blog.image],
  date: blog.date,
  author: blog.author,
  category: blog.category,
  tags: blog.tags || [],
  status: "published",
}));

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const fallbackNewsImage = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1600";

const normalizeArticle = (article: ManagedNewsArticle): ManagedNewsArticle => {
  const images = Array.isArray(article.images)
    ? article.images.filter((image) => typeof image === "string" && image.trim())
    : [];
  const primaryImage = article.image?.trim() || images[0] || fallbackNewsImage;
  const normalizedImages = images.length ? images : [primaryImage];

  return {
    ...article,
    image: primaryImage,
    images: normalizedImages,
  };
};

const writeArticles = (articles: ManagedNewsArticle[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles.map(normalizeArticle)));
};

export const getNewsArticles = () => {
  if (!canUseStorage()) return defaultArticles;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    writeArticles(defaultArticles);
    return defaultArticles.map(normalizeArticle);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid news storage");
    const normalized = (parsed as ManagedNewsArticle[]).map(normalizeArticle);
    writeArticles(normalized);
    return normalized;
  } catch {
    writeArticles(defaultArticles);
    return defaultArticles.map(normalizeArticle);
  }
};

export const getPublishedNewsArticles = () =>
  getNewsArticles().filter((article) => article.status === "published");

const englishDefaultNews: Record<string, Partial<ManagedNewsArticle>> = {
  "1": {
    title: "Top 5 Luxury Summer Getaway Destinations for 2026",
    excerpt: "Discover secluded beaches and world-class resorts that help you enjoy a refined and memorable summer escape.",
    category: "Travel",
    tags: ["Travel", "Summer", "Nha Trang"],
    content: `
      <p>Summer is the perfect time to step away from the heat and enjoy restorative moments with family and friends. If you are looking for elevated experiences, these five destinations deserve a place on your shortlist.</p>
      <h3>1. Nha Trang - A Blue-Sea Retreat</h3>
      <p>With pristine islands and international five-star resorts, Nha Trang remains one of Vietnam's leading leisure destinations. Guests can enjoy mineral mud spa therapies, private cruises and premium seafood by the sea.</p>
      <h3>2. Phu Quoc - The Pearl Island</h3>
      <p>Beyond Sao Beach and Khem Beach, Phu Quoc attracts travelers with resorts shaped by classic European architecture and clean modern design. It is one of the best places in Vietnam to watch a glowing sunset over the ocean.</p>
      <h3>3. Da Nang - Coastline and Modern Energy</h3>
      <p>Da Nang combines a vibrant city rhythm with the calm of nature. Resorts near Son Tra Peninsula offer privacy between forest and sea.</p>
      <img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1600" alt="Nha Trang View" style="width:100%; border-radius: 1rem; margin: 2rem 0;" />
      <h3>4. Quy Nhon - Untouched Coastal Beauty</h3>
      <p>For travelers who prefer quiet landscapes, Quy Nhon is a beautiful choice. Dramatic rocks and clear water create a calm setting for nature-led luxury stays.</p>
      <h3>5. Da Lat - Misty Highland Charm</h3>
      <p>Da Lat's cool climate, French-era villas and boutique hotels bring a nostalgic, intimate atmosphere for guests who want to slow down.</p>
      <p>Contact Luxury Stay today to reserve your summer escape and receive exclusive seasonal benefits.</p>
    `,
  },
  "2": {
    title: "The Art of Wine Tasting at Luxury Stay",
    excerpt: "A refined journey through world-class wine regions, curated by the Luxury Stay sommelier team.",
    category: "Dining",
    tags: ["Dining", "Wine", "Luxury"],
    content: `
      <p>Wine tasting is not only a habit, but an art of living. At Luxury Stay, we curate refined experiences for guests who appreciate detail, aroma and craft.</p>
      <p>Every bottle is selected from celebrated regions such as Bordeaux, Tuscany and Napa Valley. Our experienced sommeliers are ready to recommend pairings that match your taste and the dishes you enjoy.</p>
    `,
  },
  "3": {
    title: "Special Honeymoon Packages for Romantic Escapes",
    excerpt: "Luxury Stay creates romantic packages for newlyweds, turning the first chapter of marriage into a beautiful memory.",
    category: "Events",
    tags: ["Events", "Honeymoon", "Romance"],
    content: `
      <p>A honeymoon begins a lifelong journey together. Luxury Stay has designed thoughtful romantic packages to make that beginning feel luminous and unforgettable.</p>
      <p>Services include romantic room styling with candles and roses, a seaside dinner under the stars, a couple spa journey and a premium keepsake from the hotel.</p>
    `,
  },
  "4": {
    title: "Five-Star Spa Skincare Rituals",
    excerpt: "Natural skincare therapies and modern techniques help restore your skin's fresh, healthy glow.",
    category: "Wellness",
    tags: ["Wellness", "Spa", "Beauty"],
    content: `
      <p>Your skin reflects both wellbeing and state of mind. At Luxury Stay spas, premium organic products meet skilled massage techniques to bring renewal and balance.</p>
      <p>Each ritual is designed to calm the senses while supporting visible radiance, helping you leave refreshed from the inside out.</p>
    `,
  },
};

export const localizeNewsArticle = (article: ManagedNewsArticle, language: "vi" | "en") =>
  language === "en" && englishDefaultNews[article.id]
    ? { ...article, ...englishDefaultNews[article.id] }
    : article;

export const localizeNewsArticles = (articles: ManagedNewsArticle[], language: "vi" | "en") =>
  articles.map((article) => localizeNewsArticle(article, language));

export const getNewsArticleById = (id?: string | number) =>
  getNewsArticles().find((article) => article.id === String(id));

export const createNewsArticle = (data: Partial<ManagedNewsArticle>) => {
  const article: ManagedNewsArticle = {
    id: `news-${Date.now()}`,
    title: data.title?.trim() || "Bai viet moi",
    excerpt: data.excerpt?.trim() || "",
    content: data.content?.trim() || "",
    image: data.image?.trim() || data.images?.[0] || fallbackNewsImage,
    images: data.images?.length ? data.images : [data.image?.trim() || fallbackNewsImage],
    date: data.date || new Date().toISOString().slice(0, 10),
    author: data.author?.trim() || "Admin",
    category: data.category || newsCategories[0],
    tags: data.tags || [],
    status: data.status || "draft",
  };

  const next = [article, ...getNewsArticles()];
  writeArticles(next);
  return article;
};

export const updateNewsArticle = (id: string, data: Partial<ManagedNewsArticle>) => {
  let updated: ManagedNewsArticle | undefined;
  const next = getNewsArticles().map((article) => {
    if (article.id !== String(id)) return article;
    updated = normalizeArticle({ ...article, ...data, id: article.id });
    return updated;
  });
  writeArticles(next);
  return updated;
};

export const deleteNewsArticle = (id: string) => {
  const next = getNewsArticles().filter((article) => article.id !== String(id));
  writeArticles(next);
};

export const toggleNewsStatus = (id: string) => {
  const article = getNewsArticleById(id);
  if (!article) return undefined;
  return updateNewsArticle(id, {
    status: article.status === "published" ? "draft" : "published",
  });
};
