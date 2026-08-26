import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ParaElement extends HTMLElement {
  anim?: gsap.core.Animation;
}

gsap.registerPlugin(ScrollTrigger);

// This function re-runs on every ScrollTrigger refresh, and it used to register
// that listener from inside itself, so each run added another one and the count
// climbed with every refresh. Bind it once instead.
let refreshBound = false;

export default function setSplitText() {
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Phones are left out of this on purpose, as they always were. Running it
  // there hid the About Me heading and paragraph until a trigger fired and put
  // a slide on the What I Do heading, and between them the section did not
  // settle and the Build and Market box below it did not come in cleanly. The
  // reveal is a desktop-width effect; on a phone the text is simply there.
  if (window.innerWidth < 900) return;

  const paras: NodeListOf<ParaElement> = document.querySelectorAll(".para");
  const titles: NodeListOf<ParaElement> = document.querySelectorAll(".title");

  // Below 1025 this is the cue the Build and Market panels use, so the headings
  // and the paragraph arrive on the same terms they do: the section's middle
  // has to reach a little above halfway up the viewport, not merely its top
  // edge. That canvas is 2121px tall, so an edge test fired while the hero
  // still filled the screen.
  const TriggerStart = window.innerWidth <= 1024 ? "center 55%" : "20% 60%";

  // One behaviour at every width this runs at, and it is the desktop one: the
  // reveal plays on the way down, reverses on the way back up and plays again
  // on the next pass. It had become a one-shot below 1025, so the same section
  // revealed two different ways depending on the screen.
  const ToggleAction = "play pause resume reverse";

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

  if (!refreshBound) {
    refreshBound = true;
    ScrollTrigger.addEventListener("refresh", () => setSplitText());
  }
}
