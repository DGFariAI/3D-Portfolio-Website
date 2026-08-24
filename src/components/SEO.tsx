import { useEffect } from "react";

const SITE_URL = "https://dgfari.com";
const DEFAULT_IMAGE = "/dgfari-og.jpg?v=5";

interface Props {
  title: string;
  description: string;
  /** Route path, e.g. "/portfolio". Used to build the canonical URL. */
  path: string;
  image?: string;
}

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

/**
 * Per-route document metadata.
 *
 * index.html can only describe one page, but this app now serves a hub, a
 * portfolio and a blog from the same document. Each route declares its own
 * title, description, canonical URL and social preview here.
 *
 * Note the limitation: this runs after the JavaScript does. Google renders JS
 * and will see it, but crawlers that only read raw HTML will not. That is what
 * the pre-rendering phase of the plan addresses; these tags are what make that
 * step work, because pre-rendering captures the DOM after they have been set.
 */
const SEO = ({ title, description, path, image = DEFAULT_IMAGE }: Props) => {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    // Absolute, because a root-relative og:image is ignored by several
    // unfurlers even though browsers resolve it fine.
    const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
    document.title = title;

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, description, path, image]);

  return null;
};

export default SEO;
