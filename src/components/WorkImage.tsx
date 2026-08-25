import { useEffect, useRef, useState } from "react";
import { MdArrowOutward } from "react-icons/md";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface Props {
  image: string;
  alt?: string;
  video?: string;
  /** First frame of the clip, shown by the video element while it buffers. */
  poster?: string;
  link?: string;
  videoLeft?: number;
}

const WorkImage = (props: Props) => {
  /* Work switches at 900, not at the site-wide 1025, and has to agree with
     Work.css or these per-card framing offsets are applied against the wrong
     card widths. Deliberately local: no other section moves at 900. */
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Whether this card's video may start loading at all. Every card used to
  // mount its <video> with preload="auto" on first render, so a single page
  // visit began fetching all six work clips at once. They are large, so that
  // was hundreds of megabytes of traffic before the visitor had scrolled
  // anywhere near the Work section.
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!props.video || !wrapRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const el = wrapRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      // Start a little before the card is on screen so it is playing by the
      // time it is actually looked at.
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [props.video]);

  return (
    <div className="work-image" ref={wrapRef}>
      <a
        className="work-image-in"
        href={props.link}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor={"disable"}
      >
        {props.link && (
          <div className="work-link">
            <MdArrowOutward />
          </div>
        )}
        <img src={props.image} alt={props.alt} loading="lazy" />
        {props.video && shouldLoad && (
          <video
            src={props.video}
            poster={props.poster}
            autoPlay
            muted
            playsInline
            loop
            preload="metadata"
            onError={(e) => {
              // Leave the placeholder image in place if the clip cannot play.
              (e.currentTarget as HTMLVideoElement).style.display = "none";
            }}
            style={{
              position: "absolute",
              // The card is 3:2 but the clips are 16:9. Overflowing the card
              // by 20% makes the visible box the right shape, so `cover` crops
              // nothing; the per-card `left` nudge then chooses the framing.
              // Mobile keeps the same 120%, and the stylesheet narrows the
              // image box there so that 120% lands exactly on the card's edge
              // rather than on the card beside it.
              width: "120%",
              height: "100%",
              top: 0,
              // These per-card nudges are framing for desktop card widths. On a
              // phone the same absolute pixels crop the clip, and an inline
              // style would override the stylesheet's mobile reset, so drop
              // them here rather than fighting specificity.
              left: isDesktop ? props.videoLeft || 0 : 0,
              backgroundColor: "#000",
              objectFit: "cover",
              zIndex: 1,
            }}
          />
        )}
      </a>
    </div>
  );
};

export default WorkImage;
