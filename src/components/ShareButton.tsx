import { useCallback, useState } from "react";
import { PiShareNetworkBold, PiShareNetworkFill } from "react-icons/pi";
import ShareSheet from "./ShareSheet";

interface Props {
  /** Defaults to the site root, which is the thing worth sharing. */
  url?: string;
  image?: string;
  title?: string;
  domain?: string;
}

const ShareButton = ({
  url,
  image = "/dgfari-og.jpg?v=2",
  title = "itsdgfari",
  domain = "dgfari.com",
}: Props) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const shareUrl =
    url ?? (typeof window === "undefined" ? "https://dgfari.com" : `${window.location.origin}/`);

  return (
    <>
      <button
        type="button"
        className={`hub-share ${open ? "is-open" : ""}`}
        onClick={() => setOpen(true)}
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
