import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function setCharTimeline(
  character: THREE.Object3D<THREE.Object3DEventMap> | null,
  camera: THREE.PerspectiveCamera
) {
  let intensity: number = 0;
  setInterval(() => {
    intensity = Math.random();
  }, 200);
  gsap.registerPlugin(ScrollTrigger);

  let hasDispatchedFadeComplete = false;

  const tl1 = gsap.timeline({
    scrollTrigger: {
      trigger: ".landing-section",
      start: "top top",
      end: "bottom top",
      scrub: 1,
      invalidateOnRefresh: true,
      onEnter: () => {
        document.body.classList.add("landing-pinned");
        hasDispatchedFadeComplete = false;
      },
      onEnterBack: () => {
        document.body.classList.add("landing-pinned");
      },
      onLeave: () => {
        document.body.classList.remove("landing-pinned");
      },
      onLeaveBack: () => {
        document.body.classList.remove("landing-pinned");
        hasDispatchedFadeComplete = false;
        window.dispatchEvent(new CustomEvent("landingFadeReset"));
      },
      onUpdate: (self) => {
        // Fade the landing text out smoothly based on scroll progress
        const progress = self.progress; // 0 -> 1 over the section
        // Make fade finish a bit before the section ends so it feels responsive
        const fadeProgress = Math.min(progress / 0.4, 1); // complete by 40% scroll
        const opacity = 1 - fadeProgress;
        gsap.set([".landing-intro", ".landing-info"], { autoAlpha: opacity });

        if (!hasDispatchedFadeComplete && opacity <= 0.01) {
          hasDispatchedFadeComplete = true;
          window.dispatchEvent(new CustomEvent("landingFadeComplete"));
        }
      },
    },
  });
  const tl2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "center 55%",
      end: "bottom top",
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
  const tl3 = gsap.timeline({
    scrollTrigger: {
      trigger: ".whatIDO",
      start: "top top",
      end: "bottom top",
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
  let screenLight: any, monitor: any;
  character?.children.forEach((object: any) => {
    if (object.name === "Plane004") {
      object.children.forEach((child: any) => {
        child.material.transparent = true;
        child.material.opacity = 0;
        if (child.material.name === "Material.027") {
          monitor = child;
          child.material.color.set("#FFFFFF");
        }
      });
    }
    if (object.name === "screenlight") {
      object.material.transparent = true;
      object.material.opacity = 0;
      object.material.emissive.set("#C8BFFF");
      gsap.timeline({ repeat: -1, repeatRefresh: true }).to(object.material, {
        emissiveIntensity: () => intensity * 8,
        duration: () => Math.random() * 0.6,
        delay: () => Math.random() * 0.1,
      });
      screenLight = object;
    }
  });
  let neckBone = character?.getObjectByName("spine005");
  if (window.innerWidth > 1024) {
    if (character) {
      tl1
        .fromTo(character.rotation, { y: 0 }, { y: 0.7, duration: 1, ease: "power2.out" }, 0)
        .to(camera.position, { z: 22, ease: "power2.out" }, 0)
        // Do not move the landing container; fade handled in onUpdate above
        .fromTo(".about-me", { y: "-50%" }, { y: "0%", ease: "power2.out" }, 0);

      tl2
        .to(
          camera.position,
          { z: 75, y: 8.4, duration: 6, delay: 2, ease: "power3.inOut" },
          0
        )
        .to(".about-section", { y: "30%", duration: 6, ease: "power2.out" }, 0)
        .to(".about-section", { opacity: 0, delay: 3, duration: 2, ease: "power2.out" }, 0)
        // Do not move character-model on about scroll; only disable pointer if needed
        .fromTo(
          ".character-model",
          { pointerEvents: "inherit" },
          { pointerEvents: "none", x: "0%", delay: 2, duration: 0.01, ease: "none" },
          0
        )
        .to(character.rotation, { y: 0.92, x: 0.12, delay: 3, duration: 3, ease: "power2.out" }, 0)
        .to(neckBone!.rotation, { x: 0.6, delay: 2, duration: 3, ease: "power2.out" }, 0)
        .to(monitor.material, { opacity: 1, duration: 0.8, delay: 3.2, ease: "power2.out" }, 0)
        .to(screenLight.material, { opacity: 1, duration: 0.8, delay: 4.5, ease: "power2.out" }, 0)
        .fromTo(
          ".what-box-in",
          { display: "none" },
          { display: "flex", duration: 0.1, delay: 6 },
          0
        )
        .fromTo(
          monitor.position,
          { y: -10, z: 2 },
          { y: 0, z: 0, delay: 1.5, duration: 3, ease: "power2.out" },
          0
        )
        .fromTo(
          ".character-rim",
          { opacity: 1, scaleX: 1.4 },
          { opacity: 0, scale: 0, y: "-70%", duration: 5, delay: 2, ease: "power2.out" },
          0.3
        );

      tl3
        // Keep landing image fixed; do not move out on What I Do
        //.fromTo(
        //  ".character-model",
        //  { y: "0%" },
        //  { y: "-100%", duration: 4, ease: "power2.inOut", delay: 1 },
        //  0
        //)
        .fromTo(".whatIDO", { y: 0 }, { y: "15%", duration: 2, ease: "power2.out" }, 0)
        .to(character.rotation, { x: -0.04, duration: 2, delay: 1, ease: "power2.out" }, 0);
    }
  } else {
    if (character) {
      const tM2 = gsap.timeline({
        scrollTrigger: {
          trigger: ".what-box-in",
          start: "top 70%",
          end: "bottom top",
        },
      });
      tM2.to(".what-box-in", { display: "flex", duration: 0.1, delay: 0 }, 0);
    }
  }
}

export function setAllTimeline() {
  const careerTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".career-section",
      start: "top 30%",
      end: "100% center",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  careerTimeline
    .fromTo(
      ".career-timeline",
      { maxHeight: "10%" },
      { maxHeight: "100%", duration: 0.5 },
      0
    )

    .fromTo(
      ".career-timeline",
      { opacity: 0 },
      { opacity: 1, duration: 0.1 },
      0
    )
    .fromTo(
      ".career-info-box",
      { opacity: 0 },
      { opacity: 1, stagger: 0.1, duration: 0.5 },
      0
    )
    .fromTo(
      ".career-dot",
      { animationIterationCount: "infinite" },
      {
        animationIterationCount: "1",
        delay: 0.3,
        duration: 0.1,
      },
      0
    );

  if (window.innerWidth > 1024) {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: "20%", duration: 0.5, delay: 0.2 },
      0
    );
  } else {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: 0, duration: 0.5, delay: 0.2 },
      0
    );
  }
}

export function setWhatIDoTimeline() {
  gsap.registerPlugin(ScrollTrigger);
  // Reveal What I Do container and then its panels (Design/Manage)
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "center 55%",
      end: "bottom top",
      toggleActions: "restart none none none",
      invalidateOnRefresh: true,
      onLeaveBack: () => {
        tl.pause(0).progress(0);
        gsap.set(".what-box-in", { clearProps: "all", display: "none", autoAlpha: 0, y: 40 });
        gsap.set(".what-content", { clearProps: "opacity,transform", autoAlpha: 0, y: 20 });
      },
    },
  });

  tl.set(".what-box-in", { display: "flex" });

  tl.fromTo(
    ".what-box-in",
    { autoAlpha: 0, y: 40 },
    { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }
  );

  tl.fromTo(
    ".what-content",
    { autoAlpha: 0, y: 20 },
    { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.15 },
    "-=0.2"
  );
}

// Sets up the landing text fade and pinned state independently of the 3D character
export function setLandingFadeTimeline() {
  gsap.registerPlugin(ScrollTrigger);

  let hasDispatchedFadeComplete = false;

  // Pin the intro and info blocks without adding pin spacing
  const pinIntro = ScrollTrigger.create({
    trigger: ".landing-section",
    start: "top top",
    end: "bottom top",
    pin: ".landing-intro",
    pinSpacing: false,
    anticipatePin: 1,
  });
  const pinInfo = ScrollTrigger.create({
    trigger: ".landing-section",
    start: "top top",
    end: "bottom top",
    pin: ".landing-info",
    pinSpacing: false,
    anticipatePin: 1,
  });

  const st = ScrollTrigger.create({
    trigger: ".landing-section",
    start: "top top",
    end: "bottom top",
    scrub: 1,
    invalidateOnRefresh: true,
    onEnter: () => {
      hasDispatchedFadeComplete = false;
    },
    onEnterBack: () => {},
    onLeave: () => {},
    onLeaveBack: () => {
      hasDispatchedFadeComplete = false;
      window.dispatchEvent(new CustomEvent("landingFadeReset"));
    },
    onUpdate: (self) => {
      const progress = self.progress;
      const fadeProgress = Math.min(progress / 0.4, 1);
      const opacity = 1 - fadeProgress;
      gsap.set([".landing-intro", ".landing-info"], { autoAlpha: opacity });

      if (!hasDispatchedFadeComplete && opacity <= 0.01) {
        hasDispatchedFadeComplete = true;
        window.dispatchEvent(new CustomEvent("landingFadeComplete"));
      }
      if (hasDispatchedFadeComplete && opacity > 0.05) {
        // If user scrolls back up before leaveBack, reset flag so we can re-fire on next fade-out
        hasDispatchedFadeComplete = false;
        window.dispatchEvent(new CustomEvent("landingFadeReset"));
      }
    },
  });

  return () => {
    st.kill();
    pinIntro.kill();
    pinInfo.kill();
  };
}
