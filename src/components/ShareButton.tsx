import { useCallback, useState } from "react";
import { PiShareNetworkBold, PiShareNetworkFill } from "react-icons/pi";
import ShareSheet from "./ShareSheet";

interface Props {
  /** Defaults to the site root, which is the thing worth sharing. */
  url?: string;
  image?: string;
  title?: string;
  domain?: string;
  /** Fires when the sheet opens or closes. The page behind has to know: it
   *  blurs itself and stops anything moving while the sheet is up. */
  onOpenChange?: (open: boolean) => void;
}

const ShareButton = ({
  url,
  image = "/dgfari-og.jpg?v=5",
  // The name on the preview card, sitting above the domain. The wordmark on
  // the page is lowercase; this is the brand.
  title = "DGFari",
  domain = "dgfari.com",
  onOpenChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  const setAndReport = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  const close = useCallback(() => setAndReport(false), [setAndReport]);

  const shareUrl =
    url ?? (typeof window === "undefined" ? "https://dgfari.com" : `${window.location.origin}/`);

  return (
    <>
      <button
        type="button"
        className={`hub-share ${open ? "is-open" : ""}`}
        onClick={() => setAndReport(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Share this page"
      >
        {/* Both marks are rendered and stacked, with CSS fading between
            them. Swapping the element on a hover flag instead would mean a
            re-render per pointer entry and a hard cut where the fill appears,
            and :hover cannot reach across to a different element. */}
        <span className="hub-share-mark" aria-hidden="true">
          <PiShareNetworkBold className="hub-share-line" />
          <PiShareNetworkFill className="hub-share-solid" />
        </span>
      </button>

      {open && (
        <ShareSheet
          url={shareUrl}
          image={image}
          title={title}
          domain={domain}
          onClose={close}
        />
      )}
    </>
  );
};

export default ShareButton;
