import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import SEO from "../components/SEO";
import BrandCursor from "../components/BrandCursor";
import { posts, formatDate } from "../lib/posts";
import { useReveal } from "../hooks/useReveal";
import "./styles/Blogs.css";

/** The same clip the hub shows: her reading this publication. It is the one
 *  asset that ties the front door to this page, so it leads here. */
const AVATAR = {
  webm: "/videos/character/dgfari-learn.webm?v=31",
  poster: "/videos/character/dgfari-learn-poster.webp?v=24",
};

const Meta = ({ date, minutes }: { date: string; minutes: number }) => (
  <p className="learn-meta">
    <time dateTime={date}>{formatDate(date)}</time>
    <span aria-hidden="true">/</span>
    <span>{minutes} min read</span>
  </p>
);

const Blogs = () => {
  const [lead, ...rest] = posts;
  const ref = useReveal<HTMLDivElement>();

  // The clip is two megabytes and this page is mostly type. The poster paints
  // straight away and the video is fetched once the browser is otherwise idle,
  // the same deal the hub strikes with the same asset.
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    let cancelled = false;
    const start = () => {
      if (!cancelled) setShowVideo(true);
    };
    const handle = w.requestIdleCallback
      ? w.requestIdleCallback(start, { timeout: 2200 })
      : window.setTimeout(start, 700);
    return () => {
      cancelled = true;
      if (!w.requestIdleCallback) window.clearTimeout(handle);
    };
  }, []);

  return (
    <div className="learn" ref={ref}>
      <BrandCursor />
      <SEO
        title="DGFari Learn"
        description="Writing on building with purpose: brand, product, AI, and the craft behind them."
        path="/blogs"
      />

      {/* Ambient field. Fixed and behind everything, so the page has depth
          rather than sitting flat on the black. */}
      <div className="learn-aura" aria-hidden="true">
        <span className="learn-aura-a" />
        <span className="learn-aura-b" />
      </div>

      <div className="learn-inner">
        <Link className="learn-back" to="/" data-cursor="disable" data-reveal>
          <PiArrowLeftBold aria-hidden="true" />
          Back to the hub
        </Link>

        <header className="learn-hero">
          <div className="learn-hero-copy">
            <p className="learn-eyebrow" data-reveal>
              DGFari
            </p>
            <h1 data-reveal style={{ "--i": 1 } as React.CSSProperties}>
              Learn
            </h1>
            <p
              className="learn-tagline"
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
            >
              Writing on becoming who you were made to be, and building with
              the One who made you.
            </p>
            <p
              className="learn-count"
              data-reveal
              style={{ "--i": 3 } as React.CSSProperties}
            >
              {posts.length} {posts.length === 1 ? "piece" : "pieces"}
            </p>
          </div>

          <div
            className="learn-hero-figure"
            aria-hidden="true"
            data-reveal
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <span className="learn-figure-glow" />
            {showVideo ? (
              <video
                ref={videoRef}
                src={AVATAR.webm}
                poster={AVATAR.poster}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img src={AVATAR.poster} alt="" />
            )}
          </div>
        </header>

        {posts.length === 0 ? (
          <div className="learn-empty" data-reveal>
            <p>The first posts are being written.</p>
          </div>
        ) : (
          <>
            <article className="learn-lead" data-reveal>
              <Link to={`/blogs/${lead.slug}`} data-cursor="disable">
                {/* The mark, held far back, so the card has something behind
                    the type instead of an empty gradient. */}
                <img
                  className="learn-lead-mark"
                  src="/images/logos/dgfari-portfolio.png"
                  alt=""
                  aria-hidden="true"
                />
                <span className="learn-flag">Latest</span>
                <h2>{lead.title}</h2>
                <p className="learn-excerpt">{lead.excerpt}</p>
                <Meta date={lead.date} minutes={lead.readingMinutes} />
                <span className="learn-cue">
                  Read this
                  <PiArrowRightBold aria-hidden="true" />
                </span>
              </Link>
            </article>

            {rest.length > 0 && (
              <>
                <h2 className="learn-more-label" data-reveal>
                  <span>The archive</span>
                </h2>

                <ul className="learn-list">
                  {rest.map((post, i) => (
                    <li
                      key={post.slug}
                      data-reveal
                      style={{ "--i": Math.min(i, 6) } as React.CSSProperties}
                    >
                      <Link to={`/blogs/${post.slug}`} data-cursor="disable">
                        <div className="learn-list-main">
                          <h3>{post.title}</h3>
                          <p className="learn-excerpt">{post.excerpt}</p>
                          <Meta
                            date={post.date}
                            minutes={post.readingMinutes}
                          />
                        </div>
                        <span className="learn-list-go" aria-hidden="true">
                          <PiArrowRightBold />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blogs;
