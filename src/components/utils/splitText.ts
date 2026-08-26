import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ParaElement extends HTMLElement {
  anim?: gsap.core.Animation;
}

type TriggeredTween = gsap.core.Tween & { scrollTrigger?: ScrollTrigger };

gsap.registerPlugin(ScrollTrigger);

// This function re-runs on every ScrollTrigger refresh, and it used to register
// that listener from inside itself, so each run added another one and the count
// climbed with every refresh. Bind it once instead.
let refreshBound = false;

export default function setSplitText() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.innerWidth < 900) return;
  const paras: NodeListOf<ParaElement> = document.querySelectorAll(".para");
  const titles: NodeListOf<ParaElement> = document.querySelectorAll(".title");

  const TriggerStart = window.innerWidth <= 1024 ? "top 60%" : "20% 60%";

  // A phone asking for the desktop site shows and hides its URL bar as you
  // scroll. That resizes the viewport, which refreshes ScrollTrigger, which
  // calls this function again, and a fromTo renders its "from" state the moment
  // it is built: every element dropped straight back to invisible and animated
  // in again. Measured at 980x2121, three resizes replayed the About title, its
  // paragraph and the What I Do heading three times each, which is the reveal
  // firing over and over rather than settling.
  //
  // Below 1025 the reveal is therefore a one-shot. An element that has already
  // played is marked and then skipped entirely on later runs, so no refresh can
  // rebuild its tween and pull it back to zero. A real desktop has no URL bar
  // that comes and goes and keeps the scroll-linked behaviour it has today.
  const revealOnce = window.innerWidth <= 1024;
  const ToggleAction = revealOnce
    ? "play none none none"
    : "play pause resume reverse";

  // Once played, drop the trigger as well. Nothing is left that a later refresh
  // could recompute, so the element simply stays where the animation left it.
  const settle = (el: ParaElement, tween: TriggeredTween) => {
    if (!revealOnce) return;
    el.dataset.revealed = "1";
    tween.scrollTrigger?.kill();
  };

  paras.forEach((para: ParaElement) => {
    para.classList.add("visible");
    if (revealOnce && para.dataset.revealed === "1") return;
    if (para.anim) {
      para.anim.progress(1).kill();
    }

    const tween: TriggeredTween = gsap.fromTo(
      para,
      { autoAlpha: 0, y: 80 },
      {
        autoAlpha: 1,
        scrollTrigger: {
          trigger: para.parentElement?.parentElement,
          toggleActions: ToggleAction,
          start: TriggerStart,
        },
        duration: 1,
        ease: "power3.out",
        y: 0,
        onComplete: () => settle(para, tween),
      }
    );
    para.anim = tween;
  });

  titles.forEach((title: ParaElement) => {
    if (revealOnce && title.dataset.revealed === "1") return;
    if (title.anim) {
      title.anim.progress(1).kill();
    }

    const tween: TriggeredTween = gsap.fromTo(
      title,
      { autoAlpha: 0, y: 80, rotate: 10 },
      {
        autoAlpha: 1,
        scrollTrigger: {
          trigger: title.parentElement?.parentElement,
          toggleActions: ToggleAction,
          start: TriggerStart,
        },
        duration: 0.8,
        ease: "power2.inOut",
        y: 0,
        rotate: 0,
        onComplete: () => settle(title, tween),
      }
    );
    title.anim = tween;
  });

  if (!refreshBound) {
    refreshBound = true;
    ScrollTrigger.addEventListener("refresh", () => setSplitText());
  }
}
