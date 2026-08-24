import { ComponentType, CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PiCameraFill,
  PiCaretRightBold,
  PiFlameFill,
  PiPaintBrushFill,
} from "react-icons/pi";
import SEO from "../components/SEO";
import ShareButton from "../components/ShareButton";
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
  icon?: ComponentType<{ "aria-hidden"?: boolean }>;
  logo?: string;
  to?: string;
  href?: string;
  /** Halo colour for the mark on hover. See the note above LINKS. */
  glow: string;
}

/**
 * The four marks are drawn to one construction spec, and each keeps its own
 * hue rather than being unified to a single colour.
 *
 * The colours were never the problem: measured across the originals, saturation
 * varied by 1.4x and value by 1.5x, which is a family. Limb weight varied by
 * 4.6x, which is not. So they are normalised on weight and optical size and
 * left alone on hue, because the gold and the warm orange are the only warmth
 * on an otherwise violet page, and because Art and Studio have their own
 * domains: the mark someone taps has to match the one they land on.
 *
 * The pipeline that produced them is kept in source-assets/logos/normalised.
 */
const LINKS: HubLink[] = [
  {
    label: "DGFari's Portfolio",
    logo: "/images/logos/dgfari-portfolio.svg",
    to: "/portfolio",
    glow: "rgba(183, 102, 255, 0.85)",
  },
  {
    label: "DGFari AI",
    logo: "/images/logos/dgfari-ai.svg",
    icon: PiFlameFill,
    to: "/ai",
    glow: "rgba(238, 122, 255, 0.85)",
  },
  {
    label: "DGFari Art",
    logo: "/images/logos/dgfari-art.svg",
    icon: PiPaintBrushFill,
    href: "https://dgfariart.com",
    glow: "rgba(255, 217, 112, 0.85)",
  },
  {
    label: "DGFari Studio",
    logo: "/images/logos/dgfari-studio.svg",
    icon: PiCameraFill,
    href: "https://dgfaristudio.com",
    glow: "rgba(255, 151, 107, 0.85)",
  },
];

/**
 * A row's mark: the real logo when its file is present, the placeholder icon
 * when it is not.
 *
 * A missing or undecodable file would otherwise render as a broken image, so
 * the fallback catches the error and shows the placeholder instead.
 */
const LinkMark = ({ link }: { link: HubLink }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const Icon = link.icon;

  if (link.logo && !logoFailed) {
    return (
      <span className="hub-link-mark" aria-hidden="true">
        <img src={link.logo} alt="" onError={() => setLogoFailed(true)} />
      </span>
    );
  }

  return (
    <span className="hub-link-mark" aria-hidden="true">
      {Icon ? <Icon /> : null}
    </span>
  );
};

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
        {/* Inside the header rather than pinned to the viewport, so it can be
            positioned against the wordmark and the link column instead of
            against whatever the window happens to be. */}
        <ShareButton />

        <h1>
          itsdgfari
          {/* 11-point rosette, generated so the spikes are even and every
              vertex sits inside the viewBox: the previous hand-drawn path ran
              past its edges, which is what clipped it. */}
          <svg className="hub-verified" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="currentColor"
              d="M24.00 1.00 L29.24 6.15 L36.43 4.65 L38.06 11.82 L44.92 14.45 L42.41 21.35 L46.77 27.27 L40.92 31.73 L41.38 39.06 L34.06 39.65 L30.48 46.07 L24.00 42.60 L17.52 46.07 L13.94 39.65 L6.62 39.06 L7.08 31.73 L1.23 27.27 L5.59 21.35 L3.08 14.45 L9.94 11.82 L11.57 4.65 L18.76 6.15 Z"
            />
            <path
              d="M15.5 24.5 L21.5 30.5 L32.5 18.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="5"
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
          // Handed to CSS as a custom property so the hover rule lives in the
          // stylesheet with the rest of the row's states, rather than needing a
          // hover flag in React to know which colour to apply.
          const style = { "--mark-glow": link.glow } as CSSProperties;

          const inner = (
            <>
              <LinkMark link={link} />
              <span className="hub-link-label">{link.label}</span>
              <span className="hub-link-end" aria-hidden="true">
                <PiCaretRightBold />
              </span>
            </>
          );

          if (link.to) {
            return (
              <Link className="hub-link" to={link.to} style={style} key={link.label}>
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
              style={style}
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
