import { useCallback, useEffect, useRef, useState } from "react";
import { PiCheckBold, PiShareNetworkBold } from "react-icons/pi";

interface Props {
  url?: string;
  title?: string;
  text?: string;
}

/**
 * Share control for the hub.
 *
 * Most traffic to a link-in-bio page arrives through an in-app browser, where
 * the address bar is a non-editable strip and copying the URL takes several taps
 * through a menu most people never open. That is the friction this removes.
 *
 * Two paths, deliberately: the native share sheet where it exists, which is
 * mobile and a few desktop browsers, and a clipboard copy everywhere else.
 * The fallback is not optional, since desktop Chrome and Firefox do not offer
 * navigator.share at all.
 */
const ShareButton = ({
  url,
  title = "DGFari",
  text = "Kingdom builder and marketer. Portfolio, writing, art and studio, all in one place.",
}: Props) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const flashCopied = useCallback(() => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2200);
  }, []);

  const onShare = useCallback(async () => {
    const shareUrl = url ?? `${window.location.origin}/`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        // Closing the sheet is a decision, not a failure: silently copying
        // afterwards would be a surprise. Any other error falls through.
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      flashCopied();
    } catch {
      // Clipboard access can be refused, typically on an insecure origin.
      // Selecting the URL is then the only route left, so say nothing rather
      // than claim a copy that did not happen.
    }
  }, [url, title, text, flashCopied]);

  return (
    <div className="hub-share">
      <button
        type="button"
        className="hub-share-button"
        onClick={onShare}
        aria-label="Share this page"
      >
        {copied ? <PiCheckBold aria-hidden="true" /> : <PiShareNetworkBold aria-hidden="true" />}
      </button>
      {/* Announced to screen readers as well as shown, so the confirmation is
          not purely visual. */}
      <span className="hub-share-toast" role="status" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
};

export default ShareButton;
