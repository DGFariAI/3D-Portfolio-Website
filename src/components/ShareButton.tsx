import { useCallback, useState } from "react";
import { PiShareNetworkBold } from "react-icons/pi";
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
        className="hub-share"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Share this page"
      >
        <PiShareNetworkBold aria-hidden="true" />
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
