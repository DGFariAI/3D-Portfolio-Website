import {
  ComponentType,
  CSSProperties,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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
import BrandCursor from "../components/BrandCursor";

/**
 * The avatar clip: her reading DGFari Learn, keyed off green into a VP9 WebM
 * with a real alpha channel, plus a transparent WebP poster of the same size.
 *
 * It is built to loop. The generation was constrained to end on the frame it
 * started on, so the wrap point is invisible and the clip can run continuously
 * without anyone seeing a cut. The green-screen master and the still it was
 * generated from live in source-assets/masters.
 */
const AVATAR = {
  webm: "/videos/character/dgfari-learn.webm?v=25",
  poster: "/videos/character/dgfari-learn-poster.webp?v=20",
};

interface HubLink {
  label: string;
  icon?: ComponentType<{ "aria-hidden"?: boolean }>;
  logo?: string;
  to?: string;
  href?: string;
  /** Halo colour for the mark on hover. See the note above LINKS. */
  glow: string;
  /** Brightness and saturation lift for a mark that renders dark. See below. */
  lift?: number;
  sat?: number;
}

/**
 * Each row's glow is its own logo's colour, not one shared violet, and two of
 * the marks are lifted so all four read at the same brightness.
 *
 * The AI and Art artwork renders far darker than the other two: measured on the
 * live page, mean value across their ink was 0.59 and 0.53 against 0.90 for the
 * flame and 0.70 for the star. Total light output per row was already even, so
 * the difference was never the halo, it was the glyphs themselves.
 *
 * Two of these marks are violet, one is gold and one is warm orange. A single
 * brand halo behind all four would sit wrong under the two that are not violet,
 * so each colour is sampled from the logo file itself: the mean of its pixels
 * weighted by alpha and saturation, then lifted in value so the halo reads as
 * light rather than as a smudge of the mark's own colour.
 */
const LINKS: HubLink[] = [
  {
    label: "DGFari's Portfolio",
    logo: "/images/logos/dgfari-portfolio.png",
    to: "/portfolio",
    glow: "rgba(202, 122, 255, 0.85)",
  },
  {
    label: "DGFari AI",
    logo: "/images/logos/DGFari-AI.png",
    icon: PiFlameFill,
    to: "/ai",
    glow: "rgba(202, 120, 255, 0.85)",
    lift: 1.45,
    sat: 1.2,
  },
  {
    label: "DGFari Art",
    logo: "/images/logos/DGFari-Art.png",
    icon: PiPaintBrushFill,
    href: "https://dgfariart.com",
    glow: "rgba(255, 224, 155, 0.85)",
    // Stops climbing past 1.6: its strokes are thin and already clipping, and
    // more brightness only drains the gold, dropping saturation from 0.41 to
    // 0.32 without adding any light.
    lift: 1.6,
    sat: 1.45,
  },
  {
    label: "DGFari Studio",
    logo: "/images/logos/DGFari-Studio.png",
    icon: PiCameraFill,
    href: "https://dgfaristudio.com",
    glow: "rgba(255, 152, 114, 0.85)",
  },
];

/**
 * A row's mark: the real logo when its file is present, the placeholder icon
 * when it is not.
 *
 * The three brand logos are wired to their paths before the files exist, so
 * dropping them into public/images/logos makes them appear with no code change.
 * Until then a missing file would render as a broken image, so the fallback
 * catches the error and shows the placeholder instead.
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
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
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

  /* Where the book sits inside the clip, read off the frame with a percentage
     grid: the covers run 26% to 92% across and 52% to the bottom edge. */
  const BOOK = { x0: 0.26, x1: 0.92, y0: 0.52, y1: 0.98 };

  /* Only the book opens the blog.
   *
   * Tested as an overlaid element first, and it made the clip stutter: a
   * positioned box on top of a video with an alpha channel pulls it out of its
   * own compositing layer, so the browser recomposites her every frame. Hit
   * testing the coordinates costs nothing and puts nothing over her.
   *
   * detail === 0 means the button was activated by keyboard rather than a
   * pointer, where there are no coordinates to test and the whole control
   * should just work. */
  const openBlog = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail !== 0) {
      const b = e.currentTarget.getBoundingClientRect();
      const fx = (e.clientX - b.left) / b.width;
      const fy = (e.clientY - b.top) / b.height;
      if (fx < BOOK.x0 || fx > BOOK.x1 || fy < BOOK.y0 || fy > BOOK.y1) return;
    }
    navigate("/blogs");
  };

  /* The cursor collapses over the book, the way it does over every other
     control on the page. The book is not an element, though, it is a region
     inside her, so the attribute that drives the cursor is set and cleared on
     the same hit test the click uses. Written straight to the DOM node rather
     than held in state: this fires on every pointer move, and re-rendering her
     to toggle one attribute would be a re-render per frame of mouse travel. */
  const trackBook = (e: MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const b = el.getBoundingClientRect();
    const fx = (e.clientX - b.left) / b.width;
    const fy = (e.clientY - b.top) / b.height;
    const onBook =
      fx >= BOOK.x0 && fx <= BOOK.x1 && fy >= BOOK.y0 && fy <= BOOK.y1;

    if (onBook) el.dataset.cursor = "disable";
    else delete el.dataset.cursor;
    // The hand cursor belongs on the book too, and nowhere else on her.
    el.style.cursor = onBook ? "pointer" : "default";
  };

  const leaveBook = (e: MouseEvent<HTMLButtonElement>) => {
    delete e.currentTarget.dataset.cursor;
    e.currentTarget.style.cursor = "default";
  };

  // The blur behind the sheet is applied to this page once, not recomputed per
  // frame by the sheet's own backdrop-filter, so the avatar has to hold still
  // while it is up: a playing video under a filter re-runs that filter on every
  // frame it paints, which is the whole cost the static blur exists to avoid.
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // She keeps playing behind the sheet. Pausing her was a performance
    // decision and it was the wrong trade: the freeze and the restart are both
    // visible through a 6px blur, so what it saved in paint it spent twice over
    // on making the sheet feel like it stopped the page dead.
    void v.play().catch(() => {});
  }, [sharing, showVideo]);

  return (
    <div className={`hub ${sharing ? "is-sharing" : ""}`}>
      <BrandCursor />
      <SEO
        title="DGFari"
        description="Kingdom builder and marketer. Portfolio, writing, art and studio, all in one place."
        path="/"
      />

      <header className="hub-intro">
        {/* Inside the header rather than pinned to the viewport, so it can be
            positioned against the wordmark and the link column instead of
            against whatever the window happens to be. */}
        <ShareButton onOpenChange={setSharing} />

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

      {/* Only the book she is holding opens the blog. The whole clip is the
          button, but the handler ignores anything outside the book, so
          clicking her hair or the space beside her does nothing. */}
      <button
        className="hub-avatar"
        onClick={openBlog}
        onMouseMove={trackBook}
        onMouseLeave={leaveBook}
        aria-label="Read DGFari Learn, my blog"
      >
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

      {/* Everything below her, as one block.
          On a phone this box does not exist: it is display: contents, so these
          children lay out in the page column exactly as they did before. On a
          desktop it becomes the second column. Wrapping them is what lets the
          two-column layout happen with no change to the order of the document,
          so the reading order and the tab order stay as they are. */}
      <div className="hub-panel">
        <Divider />

        <nav className="hub-links" aria-label="Where to find me">
          {LINKS.map((link) => {
            // Handed to CSS as a custom property so the hover rule lives in the
            // stylesheet with the rest of the row's states, rather than needing a
            // hover flag in React to know which colour to apply.
            const style = {
              "--mark-glow": link.glow,
              "--mark-lift": link.lift ?? 1,
              "--mark-sat": link.sat ?? 1,
            } as CSSProperties;

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
                <Link
                  className="hub-link"
                  to={link.to}
                  style={style}
                  key={link.label}
                  data-cursor="disable"
                >
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
                data-cursor="disable"
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
    </div>
  );
};

export default Hub;
