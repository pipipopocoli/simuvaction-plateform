import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export const revalidate = 300;

type LiveWireItem = {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
};

const RSS_SOURCES = [
  {
    source: "Reuters",
    url: "https://feeds.reuters.com/reuters/worldNews",
  },
  {
    source: "AP",
    url: "https://feeds.apnews.com/rss/apf-topnews",
  },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  trimValues: true,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function toIsoOrNow(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function normalizeRss(sourceName: string, xml: string): LiveWireItem[] {
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
    feed?: { entry?: unknown };
  };

  const rssItems = asArray(parsed.rss?.channel?.item)
    .map((item) => {
      const value = item as Record<string, unknown>;
      const title = cleanText(value.title);
      const url = cleanText(value.link);
      const publishedAt = cleanText(value.pubDate || value.published || value.updated) || new Date().toISOString();

      if (!title || !url) {
        return null;
      }

      return {
        title,
        source: sourceName,
        publishedAt: toIsoOrNow(publishedAt),
        url,
      } satisfies LiveWireItem;
    })
    .filter((item): item is LiveWireItem => Boolean(item));

  if (rssItems.length > 0) {
    return rssItems;
  }

  return asArray(parsed.feed?.entry)
    .map((entry) => {
      const value = entry as Record<string, unknown>;
      const rawLink = value.link as Record<string, string> | string | undefined;
      const title = cleanText(value.title);
      const url = typeof rawLink === "string" ? rawLink : cleanText(rawLink?.href);
      const publishedAt = cleanText(value.published || value.updated) || new Date().toISOString();

      if (!title || !url) {
        return null;
      }

      return {
        title,
        source: sourceName,
        publishedAt: toIsoOrNow(publishedAt),
        url,
      } satisfies LiveWireItem;
    })
    .filter((item): item is LiveWireItem => Boolean(item));
}

export async function GET() {
  const batches = await Promise.all(
    RSS_SOURCES.map(async (source) => {
      try {
        const response = await fetch(source.url, {
          next: { revalidate },
          headers: {
            "User-Agent": "SimuVactionCommons/1.0 (+live-wire)",
          },
        });

        if (!response.ok) {
          return [] as LiveWireItem[];
        }

        const xml = await response.text();
        return normalizeRss(source.source, xml);
      } catch {
        return [] as LiveWireItem[];
      }
    }),
  );

  const items = batches
    .flat()
    .sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt))
    .slice(0, 12);

  return NextResponse.json({ items });
}
