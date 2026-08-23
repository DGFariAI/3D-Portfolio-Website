import { useEffect, useRef } from "react";
import "./styles/WhatIDo.css";
import { setWhatIDoTimeline } from "./utils/GsapScroll";

const WhatIDo = () => {
  const containerRef = useRef<(HTMLDivElement | null)[]>([]);
  const setRef = (el: HTMLDivElement | null, index: number) => {
    containerRef.current[index] = el;
  };
  useEffect(() => {
    setWhatIDoTimeline();

    const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    // Keep the exact listener references. Passing a fresh arrow to
    // removeEventListener never matches the one that was added, so the old
    // cleanup removed nothing and the handlers outlived the component.
    const bound = containerRef.current.map((container) => {
      if (!container) return null;
      container.classList.remove("what-noTouch");
      const onClick = () => handleClick(container);
      container.addEventListener("click", onClick);
      return { container, onClick };
    });

    return () => {
      bound.forEach((entry) => {
        entry?.container.removeEventListener("click", entry.onClick);
      });
    };
  }, []);
  return (
    <div className="whatIDO">
      <div className="what-box">
        <h2 className="title">
          W<span className="hat-h2">HAT</span>
          <div>
            I<span className="do-h2"> DO</span>
          </div>
        </h2>
      </div>
      <div className="what-box">
        <div className="what-box-in">
          <div className="what-border2">
            <svg width="100%">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
              <line
                x1="100%"
                y1="0"
                x2="100%"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
            </svg>
          </div>
          <div
            className="what-content what-noTouch"
            ref={(el) => setRef(el, 0)}
          >
            <div className="what-border1">
              <svg height="100%">
                <line
                  x1="0"
                  y1="0"
                  x2="100%"
                  y2="0"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner"></div>

            <div className="what-content-in">
              <h3>BUILD</h3>
              <h4>Description</h4>
              <p>
                I build with purpose, shaping brands and digital products that
                carry a message. Functional, scalable, and made to outlast the
                trend cycle.
              </p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                <div className="what-tags">Product Strategy</div>
                <div className="what-tags">Full-Stack Development</div>
                <div className="what-tags">AI Integration</div>
                <div className="what-tags">Rapid Prototyping</div>
                <div className="what-tags">Design Systems</div>
              </div>
              <div className="what-arrow"></div>
            </div>
          </div>
          <div
            className="what-content what-noTouch"
            ref={(el) => setRef(el, 1)}
          >
            <div className="what-border1">
              <svg height="100%">
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner"></div>
            <div className="what-content-in">
              <h3>MARKET</h3>
              <h4>Description</h4>
              <p>
                I take products to market through story-driven campaigns,
                sharpening positioning, growing audiences, and turning attention
                into lasting trust.
              </p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                <div className="what-tags">Brand Storytelling</div>
                <div className="what-tags">Copywriting</div>
                <div className="what-tags">Content & Video</div>
                <div className="what-tags">Positioning</div>
                <div className="what-tags">Data Analysis</div>
                <div className="what-tags">Community Building</div>
              </div>
              <div className="what-arrow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;

function handleClick(container: HTMLDivElement) {
  container.classList.toggle("what-content-active");
  container.classList.remove("what-sibling");
  if (container.parentElement) {
    const siblings = Array.from(container.parentElement.children);

    siblings.forEach((sibling) => {
      if (sibling !== container) {
        sibling.classList.remove("what-content-active");
        sibling.classList.toggle("what-sibling");
      }
    });
  }
}
