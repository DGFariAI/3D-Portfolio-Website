import { useCallback, useEffect, useRef, useState } from "react";
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

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  const state = closing ? "is-closing" : entered ? "is-open" : "";

  return (
    <div className={`share-layer ${state}`}>
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
