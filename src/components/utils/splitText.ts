import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ParaElement extends HTMLElement {
  anim?: gsap.core.Animation;
}

gsap.registerPlugin(ScrollTrigger);

export default function setSplitText() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.innerWidth < 900) return;
  const paras: NodeListOf<ParaElement> = document.querySelectorAll(".para");
  const titles: NodeListOf<ParaElement> = document.querySelectorAll(".title");

  const TriggerStart = window.innerWidth <= 1024 ? "top 60%" : "20% 60%";

  // The four actions are onEnter, onLeave, onEnterBack and onLeaveBack, and it
  // is the last one that made the reveal restage itself: scrolling back up past
  // the start reversed it to nothing, so every trip down played it again from
  // the beginning. Measured at 980x2121, the About title, its paragraph and the
  // What I Do heading all fell to opacity 0 on the way up and animated back in
  // on the way down, every single time.
  //
  // That canvas is a phone asking for the desktop site, where the whole page is
  // on screen at once and scrolling back and forth is normal, so the headings
  // never appeared to settle. There the reveal plays once and then holds. A
  // real desktop keeps the original behaviour. 1024 is the boundary the start
  // offset above already uses to tell the two apart.
  const ToggleAction =
    window.innerWidth <= 1024 ? "play none none none" : "play pause resume reverse";

  paras.forEach((para: ParaElement) => {
    para.classList.add("visible");
    if (para.anim) {
      para.anim.progress(1).kill();
    }

    para.anim = gsap.fromTo(
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
      }
    );
  });

  titles.forEach((title: ParaElement) => {
    if (title.anim) {
      title.anim.progress(1).kill();
    }

    title.anim = gsap.fromTo(
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
      }
    );
  });

  ScrollTrigger.addEventListener("refresh", () => setSplitText());
}
