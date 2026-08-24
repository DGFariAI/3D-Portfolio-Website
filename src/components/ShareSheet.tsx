import { CSSProperties, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { PiCheckBold, PiCopyBold, PiShareFatBold, PiXBold } from "react-icons/pi";

interface Props {
  url: string;
  /** Preview image, the same card an unfurler will show. */
  image: string;
  title: string;
  domain: string;
  onClose: () => void;
}

const CLOSE_MS = 260;
/** How far the sheet has to travel before letting go dismisses it. */
const DISMISS_PX = 90;
/** A flick this fast dismisses from anywhere, which is how a short, fast
 *  downward swipe closes a sheet without dragging it the full distance. */
const DISMISS_VELOCITY = 0.55;
/** Movement before a press becomes a drag, so a tap still reads as a tap. */
const SLOP_PX = 4;

/**
 * Bottom sheet for sharing the hub.
 *
 * It shows the real preview card rather than describing it, so what someone is
 * about to paste is what they can see. Only the URL is ever copied or handed to
 * the native sheet: the tagline belongs in the page's metadata, not in the
 * visitor's clipboard.
 */
const ShareSheet = ({ url, image, title, domain, onClose }: Props) => {
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{
    id: number;
    startY: number;
    lastY: number;
    lastT: number;
    velocity: number;
    active: boolean;
  } | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLButtonElement | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setClosing(true);
    closeTimer.current = setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  // Play the entrance on the frame after mount, so the browser has a starting
  // position to animate from rather than snapping straight to the end state.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    copyRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      // Keep Tab inside the sheet: with the page still behind it, focus would
      // otherwise wander onto links the visitor cannot see.
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [dismiss]);

  const copy = useCallback(async () => {
    try {
      // The URL and nothing else.
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. Saying nothing beats claiming a copy
      // that did not happen; the URL is on screen to select by hand.
    }
  }, [url]);

  const nativeShare = useCallback(async () => {
    try {
      // Only the url: passing text as well is what put the tagline into the
      // shared message on platforms that concatenate the two.
      await navigator.share({ url });
      dismiss();
    } catch {
      /* closing the sheet is a decision, not a failure */
    }
  }, [url, dismiss]);

  // The sheet is not scrollable, so a drag can start anywhere on it. Anywhere
  // except a control or the URL: pulling the sheet shut instead of pressing
  // Copy, or instead of selecting the link to read it, would both be wrong.
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (closing || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, a, input, .share-url-text")) return;
    gesture.current = {
      id: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0,
      active: false,
    };
  }, [closing]);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dy = e.clientY - g.startY;

    if (!g.active) {
      // Absolute, not signed: an upward pull has to arm the gesture too, or the
      // resistance below is unreachable and the sheet simply ignores the drag.
      if (Math.abs(dy) < SLOP_PX) return;
      g.active = true;
      setDragging(true);
      // Capture so the drag survives the pointer leaving the sheet, which it
      // will as soon as the sheet moves out from under the finger.
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const dt = e.timeStamp - g.lastT;
    if (dt > 0) g.velocity = (e.clientY - g.lastY) / dt;
    g.lastY = e.clientY;
    g.lastT = e.timeStamp;

    // Upward is resisted rather than blocked: the sheet gives a little so the
    // gesture feels answered, instead of going dead in one direction.
    setDrag(dy >= 0 ? dy : dy / 4);
  }, []);

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.active) return;

    setDragging(false);
    const travelled = e.clientY - g.startY;
    if (travelled > DISMISS_PX || g.velocity > DISMISS_VELOCITY) {
      dismiss();
      return;
    }
    setDrag(0);
  }, [dismiss]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  const state = [closing ? "is-closing" : entered ? "is-open" : "", dragging ? "is-dragging" : ""]
    .filter(Boolean)
    .join(" ");

  const sheetHeight = sheetRef.current?.offsetHeight ?? 0;
  const layerStyle = {
    "--drag": `${drag.toFixed(1)}px`,
    "--drag-progress": sheetHeight ? Math.min(1, Math.max(0, drag / sheetHeight)) : 0,
  } as CSSProperties;

  return (
    <div className={`share-layer ${state}`} style={layerStyle}>
      <button
        type="button"
        className="share-backdrop"
        aria-label="Close"
        tabIndex={-1}
        onClick={dismiss}
      />

      <div
        className="share-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Share this page"
        ref={sheetRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="share-grabber" aria-hidden="true" />

        <div className="share-head">
          <h2>Share</h2>
          <button type="button" className="share-close" onClick={dismiss} aria-label="Close">
            <PiXBold aria-hidden="true" />
          </button>
        </div>

        <div className="share-preview">
          <img src={image} alt="" loading="lazy" />
          <div className="share-preview-meta">
            <strong>{title}</strong>
            <span>{domain}</span>
          </div>
        </div>

        <div className="share-url">
          <span className="share-url-text">{url}</span>
          <button
            type="button"
            className={`share-copy ${copied ? "is-copied" : ""}`}
            onClick={copy}
            ref={copyRef}
          >
            {copied ? <PiCheckBold aria-hidden="true" /> : <PiCopyBold aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {canNativeShare && (
          <button type="button" className="share-native" onClick={nativeShare}>
            <PiShareFatBold aria-hidden="true" />
            Share to an app
          </button>
        )}

        <span className="share-live" role="status" aria-live="polite">
          {copied ? "Link copied" : ""}
        </span>
      </div>
    </div>
  );
};

export default ShareSheet;
