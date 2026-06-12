export type NewsItem = {
  title: string;
  link: string;
  source: string;
  pubDate: string;
};

const QUERY =
  '"FIFA World Cup 2026" OR "World Cup soccer" OR "Copa Mundial"';
const FEED = `https://news.google.com/rss/search?q=${encodeURIComponent(
  QUERY,
)}&hl=en-US&gl=US&ceid=US:en`;

const PINNED: NewsItem[] = [
  {
    title:
      "Benny McLaughlin and the road to a hometown World Cup",
    link: "https://www.inquirer.com/newsletters/sports/world-cup-united-states-benny-mclaughlin-phillies-20260612.html",
    source: "Philadelphia Inquirer",
    pubDate: "2026-06-12T00:00:00Z",
  },
];

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function pick(body: string, tag: string): string {
  const m = body.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? decode(m[1]).trim() : "";
}

function parse(xml: string): NewsItem[] {
  const out: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const body = m[1];
    const title = pick(body, "title");
    const link = pick(body, "link");
    const pubDate = pick(body, "pubDate");
    const source = pick(body, "source");
    if (!title || !link) continue;
    let iso = "";
    if (pubDate) {
      const d = new Date(pubDate);
      if (!isNaN(d.getTime())) iso = d.toISOString();
    }
    out.push({ title, link, source, pubDate: iso });
  }
  return out;
}

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(FEED, {
      next: { revalidate: 180 },
      headers: { "user-agent": "Mozilla/5.0 (worldcup.makeacompany.ai)" },
    });
    if (!res.ok) return PINNED;
    const xml = await res.text();
    const items = parse(xml).slice(0, 24);
    const seen = new Set(PINNED.map((p) => p.link));
    const fresh = items.filter((i) => !seen.has(i.link));
    return [...PINNED, ...fresh];
  } catch {
    return PINNED;
  }
}
