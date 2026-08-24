import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdArrowOutward } from "react-icons/md";
import SEO from "../components/SEO";
import "./styles/Hub.css";

/**
 * The avatar clip.
 *
 * Interim: the What I Do cutout, until the writing-and-reading clip exists.
 * Swapping it is this one object: a VP9 WebM with a real alpha channel plus a
 * transparent WebP poster of the same dimensions, produced the same way as the
 * other character clips.
 */
const AVATAR = {
  webm: "/videos/character/what-i-do-v2.webm?v=11",
  poster: "/videos/character/what-i-do-v2-poster.webp?v=11",
};

interface HubLink {
  label: string;
  caption: string;
  to?: string;
  href?: string;
  comingSoon?: boolean;
}

const LINKS: HubLink[] = [
  {
    label: "My Portfolio",
    caption: "Product, brand and the work behind them",
    to: "/portfolio",
  },
  {
    label: "DGFari AI",
    caption: "Coming soon",
    comingSoon: true,
  },
  {
    label: "DGFari Art",
    caption: "dgfariart.com",
    href: "https://dgfariart.com",
  },
  {
    label: "DGFari Studio",
    caption: "dgfaristudio.com",
    href: "https://dgfaristudio.com",
  },
];

const Hub = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // The poster paints immediately; the clip is nearly a megabyte and must not
  // sit in front of first render on the page every link points at.
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    let cancelled = false;
    const start = () => {
      if (!cancelled) setShowVideo(true);
    };
    const handle = w.requestIdleCallback
      ? w.requestIdleCallback(start, { timeout: 2000 })
      : window.setTimeout(start, 600);
    return () => {
      cancelled = true;
      if (!w.requestIdleCallback) window.clearTimeout(handle);
    };
  }, []);

  const openBlog = () => navigate("/blogs");

  return (
    <div className="hub">
      <SEO
        title="DGFari"
        description="Kingdom builder and marketer. Portfolio, writing, art and studio, all in one place."
        path="/"
      />

      <header className="hub-intro">
        <h1>
          DG<span>Fari</span>
        </h1>
        <p>Kingdom Builder &amp; Marketer</p>
      </header>

      {/* The avatar is a shortcut into the blog. It is deliberately not the only
          way in: the hint below it says so in words, because an unlabelled
          video is invisible to anyone who does not think to click it, and to
          every screen reader and crawler. */}
      <button className="hub-avatar" onClick={openBlog} aria-label="Read DGFari Learn, my blog">
        <span className="hub-avatar-glow" aria-hidden="true" />
        {showVideo ? (
          <video
            ref={videoRef}
            className="hub-avatar-media"
            src={AVATAR.webm}
            poster={AVATAR.poster}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            disablePictureInPicture
          />
        ) : (
          <img className="hub-avatar-media" src={AVATAR.poster} alt="" />
        )}
      </button>

      <p className="hub-hint">
        <span className="hub-hint-dot" aria-hidden="true" />
        Tap her to read <strong>DGFari Learn</strong>
      </p>

      <nav className="hub-links" aria-label="Where to find me">
        {LINKS.map((link) => {
          const inner = (
            <>
              <span className="hub-link-text">
                <span className="hub-link-label">{link.label}</span>
                <span className="hub-link-caption">{link.caption}</span>
              </span>
              {!link.comingSoon && <MdArrowOutward aria-hidden="true" />}
            </>
          );

          if (link.comingSoon) {
            return (
              <span className="hub-link is-soon" key={link.label} aria-disabled="true">
                {inner}
              </span>
            );
          }

          if (link.to) {
            return (
              <Link className="hub-link" to={link.to} key={link.label}>
                {inner}
              </Link>
            );
          }

          return (
            <a
              className="hub-link"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              key={link.label}
            >
              {inner}
            </a>
          );
        })}
      </nav>

      <footer className="hub-footer">
        <span>&copy; {new Date().getFullYear()} DGFari</span>
      </footer>
    </div>
  );
};

export default Hub;
