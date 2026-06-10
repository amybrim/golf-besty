/**
 * Golf News & Feed Service
 *
 * Pulls from real public RSS feeds covering:
 * - Golf Channel / NBC Sports Golf
 * - Golf Digest
 * - Golf.com
 * - No Laying Up
 * - Golfweek
 * - LIV Golf official
 *
 * Parses RSS XML into structured news items.
 * Tags each story with categories: LIV, PGA, Drama, Injury, Comeback, Rivalry, Off-Course, Major
 */

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
}

const RSS_FEEDS = [
  {
    // ESPN Golf — verified 200, real RSS XML
    url: "https://www.espn.com/espn/rss/golf/news",
    source: "ESPN Golf",
    fallback: null,
  },
  {
    // Golf.com — verified 200, 10 items
    url: "https://golf.com/feed/",
    source: "Golf.com",
    fallback: null,
  },
  {
    // GolfWRX — verified 200, active community + tour news
    url: "https://www.golfwrx.com/feed/",
    source: "GolfWRX",
    fallback: null,
  },
  {
    // Google News golf RSS — aggregates Golf Channel, Golf Digest, Golfweek etc.
    url: "https://news.google.com/rss/search?q=golf+PGA+LIV&hl=en-US&gl=US&ceid=US:en",
    source: "Golf News",
    fallback: null,
  },
  {
    // Google News LIV Golf specifically
    url: "https://news.google.com/rss/search?q=LIV+golf&hl=en-US&gl=US&ceid=US:en",
    source: "LIV Golf News",
    fallback: null,
  },
];

const TAG_KEYWORDS: Record<string, string[]> = {
  LIV: ["liv golf", "liv", "greg norman", "saudi", "pif", "aramco", "dustin johnson", "phil mickelson liv", "bryson dechambeau liv"],
  PGA: ["pga tour", "pga", "fedexcup", "tour card", "korn ferry", "dp world tour"],
  Drama: ["drama", "controversy", "feud", "beef", "argument", "clash", "row", "rift", "fallout", "suspended", "banned", "fined", "penalized", "cheating", "disqualified"],
  Injury: ["injury", "injured", "surgery", "withdraw", "withdrawal", "wd", "back pain", "wrist", "knee", "hip", "torn", "sprain", "fracture", "recovering", "rehab"],
  Comeback: ["comeback", "return", "returned", "back on tour", "first win", "breakthrough", "redemption", "resurgent"],
  Rivalry: ["rivalry", "rivals", "vs", "battle", "showdown", "head-to-head", "ryder cup", "presidents cup"],
  Major: ["masters", "us open", "open championship", "british open", "pga championship", "major", "slam"],
  "Off-Course": ["divorce", "personal", "family", "charity", "foundation", "business", "investment", "sponsor", "endorsement", "social media", "instagram", "interview", "podcast"],
};

function detectTags(title: string, summary: string): string[] {
  const text = (title + " " + summary).toLowerCase();
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      tags.push(tag);
    }
  }
  return tags.length > 0 ? tags : ["Golf"];
}

function parseRssXml(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Extract <item> blocks
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const getTag = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };

    const getAttr = (tag: string, attr: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i"));
      return m ? m[1].trim() : "";
    };

    const title = getTag("title").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#039;/g, "'").replace(/&quot;/g, '"');
    const link = getTag("link") || getAttr("link", "href");
    const description = getTag("description")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .trim()
      .slice(0, 300);
    const pubDate = getTag("pubDate");
    const imageUrl =
      getAttr("media:content", "url") ||
      getAttr("media:thumbnail", "url") ||
      getAttr("enclosure", "url") ||
      "";

    if (!title || !link) continue;

    const tags = detectTags(title, description);

    items.push({
      id: Buffer.from(link).toString("base64").slice(0, 32),
      title,
      summary: description || "Read the full story on " + source,
      url: link,
      source,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      imageUrl: imageUrl || undefined,
      tags,
    });
  }

  return items;
}

async function fetchFeed(feedUrl: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "GolfBesty/1.0 (golf companion app)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRssXml(xml, source);
  } catch (err) {
    console.warn(`[GolfNews] Feed failed (${source}): ${err}`);
    return [];
  }
}

// Simple in-memory cache: refresh every 10 minutes
let _cache: NewsItem[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

export async function fetchGolfNews(forceRefresh = false): Promise<NewsItem[]> {
  const now = Date.now();
  if (!forceRefresh && _cache && now - _cacheTime < CACHE_TTL) {
    return _cache;
  }

  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchFeed(f.url, f.source))
  );

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Sort by date descending, deduplicate by id
  const seen = new Set<string>();
  const deduped = all
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  _cache = deduped;
  _cacheTime = now;
  return deduped;
}

export async function getTopStories(count = 5): Promise<NewsItem[]> {
  const news = await fetchGolfNews();
  // Prioritize drama, LIV, major stories
  const priority = news.filter((n) =>
    n.tags.some((t) => ["Drama", "LIV", "Major", "Injury", "Comeback"].includes(t))
  );
  const rest = news.filter((n) => !priority.includes(n));
  return [...priority, ...rest].slice(0, count);
}
