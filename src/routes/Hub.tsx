import { ComponentType, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PiCameraFill,
  PiCaretRightBold,
  PiFlameFill,
  PiPaintBrushFill,
} from "react-icons/pi";
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
  /** Placeholder mark. Swap for `logo: "/images/logos/x.svg"` when the real
   *  logos arrive; the row renders whichever of the two is present. */
  icon?: ComponentType<{ "aria-hidden"?: boolean }>;
  logo?: string;
  to?: string;
  href?: string;
  comingSoon?: boolean;
}

const LINKS: HubLink[] = [
  { label: "DGFari's Portfolio", logo: "/itsdgfari_icon.svg", to: "/portfolio" },
  { label: "DGFari AI", icon: PiFlameFill, comingSoon: true },
  { label: "DGFari Art", icon: PiPaintBrushFill, href: "https://dgfariart.com" },
  { label: "DGFari Studio", icon: PiCameraFill, href: "https://dgfaristudio.com" },
];

/** Sparkle rule. Used above and below the link list, so it lives in one place. */
const Divider = () => (
  <div className="hub-divider" aria-hidden="true">
    <span className="hub-divider-line" />
    <svg viewBox="0 0 24 24" className="hub-divider-star">
      <path d="M12 0c.8 6.2 5 10.4 11.2 11.2v1.6C17 13.6 12.8 17.8 12 24c-.8-6.2-5-10.4-11.2-11.2v-1.6C7 10.4 11.2 6.2 12 0z" />
    </svg>
    <span className="hub-divider-line" />
  </div>
);

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
          itsdgfari
          <svg className="hub-verified" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 1.3l2.4 2.2 3.2-.3 1 3.1 2.9 1.4-1 3.1 1 3.1-2.9 1.4-1 3.1-3.2-.3L12 20.3l-2.4 2.2-3.2-.3-1-3.1-2.9-1.4 1-3.1-1-3.1 2.9-1.4 1-3.1 3.2.3z"
            />
            <path
              d="M8.4 12.1l2.4 2.4 4.8-4.9"
              fill="none"
              stroke="var(--backgroundColor)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </h1>
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

      <Divider />

      <nav className="hub-links" aria-label="Where to find me">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const inner = (
            <>
              <span className="hub-link-mark" aria-hidden="true">
                {link.logo ? <img src={link.logo} alt="" /> : Icon ? <Icon /> : null}
              </span>
              <span className="hub-link-label">{link.label}</span>
              <span className="hub-link-end" aria-hidden="true">
                {link.comingSoon ? (
                  <em className="hub-link-soon">Soon</em>
                ) : (
                  <PiCaretRightBold />
                )}
              </span>
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

      <Divider />

      <footer className="hub-footer">
        <span>&copy; {new Date().getFullYear()} DGFari</span>
      </footer>
    </div>
  );
};

export default Hub;
