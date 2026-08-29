import { marked } from "marked";

/**
 * DGFari Learn's content layer.
 *
 * Posts are markdown files in src/content/posts, pulled in by Vite at build
 * time rather than fetched from a CMS at runtime. That choice is deliberate:
 * this app injects its meta tags with JavaScript (see SEO.tsx), so anything
 * arriving over the network after first paint is content a crawler may never
 * wait for. Bundled markdown is in the JS the moment the route loads, costs
 * no API key, and versions with the site.
 *
 * A post's slug is its filename, so the file is the URL.
 */

export interface Post {
  slug: string;
  title: string;
  date: string;
  /** Shown on the index. Kept in frontmatter rather than sliced out of the
   *  body, because the first line of a post is rarely its best summary. */
  excerpt: string;
  tags: string[];
  body: string;
  /** Rendered markdown. */
  html: string;
  readingMinutes: number;
}

/** Eager, not lazy: the index needs every post's metadata to render at all,
 *  so deferring them would only trade one wait for several. */
const files = import.meta.glob("../content/posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

/**
 * Frontmatter, parsed by hand.
 *
 * gray-matter is the usual answer and it is the wrong one here: it depends on
 * Buffer, which does not exist in the browser without a polyfill, and this
 * runs client-side. The format below is all these posts need, so a dozen
 * lines beats shipping a shim for a Node global.
 */
function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Quotes are optional in this format, so strip them when present rather
    // than letting them into the rendered title.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body: raw.slice(match[0].length) };
}

/** `[Purpose, Faith]` or `Purpose, Faith`, both to a real array. */
function parseTags(value?: string): string[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((t) => t.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/** 200 words per minute, floored at 1 so nothing reads "0 min read". */
function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

marked.setOptions({ gfm: true, breaks: false });

export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const { meta, body } = parseFrontmatter(raw);
    return {
      slug,
      title: meta.title ?? slug,
      date: meta.date ?? "",
      excerpt: meta.excerpt ?? "",
      tags: parseTags(meta.tags),
      body,
      html: marked.parse(body) as string,
      readingMinutes: readingMinutes(body),
    };
  })
  // Newest first. Dates are ISO (YYYY-MM-DD), so they sort as strings.
  .sort((a, b) => b.date.localeCompare(a.date));

export const getPost = (slug?: string): Post | undefined =>
  posts.find((p) => p.slug === slug);

/** "12 August 2026". Written out rather than numeric, since a numeric date is
 *  read differently on either side of the Atlantic. */
export const formatDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
