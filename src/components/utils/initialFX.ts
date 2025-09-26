import gsap from "gsap";

export function initialFX() {
  document.body.style.overflowY = "auto";
  const mainElement = document.getElementsByTagName("main")[0];
  if (mainElement) {
    mainElement.classList.add("main-active");
  }
  gsap.to("body", {
    backgroundColor: "#0b080c",
    duration: 0.5,
    delay: 0.2,
  });

  gsap.fromTo(
    [".landing-info h3", ".landing-intro h2", ".landing-intro h1"],
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.1,
    }
  );

  gsap.fromTo(
    ".landing-h2-info",
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.1,
    }
  );

  gsap.fromTo(
    ".landing-info-h2",
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      y: 0,
      delay: 0.3,
    }
  );
  
  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      delay: 0.1,
    }
  );

  // Text switching animation disabled - keeping static text
  // LoopText(".landing-h2-info", ".landing-h2-info-1");
  // LoopText(".landing-h2-1", ".landing-h2-2");
}

// Commented out unused function to prevent build errors
/*
function LoopText(selector1: string, selector2: string) {
  var tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  const delay = 4;

  // Start with selector1 visible, selector2 hidden
  gsap.set(selector1, { opacity: 1, y: 0 });
  gsap.set(selector2, { opacity: 0, y: 80 });

  tl.to(selector1, {
    y: -80,
    opacity: 0,
    duration: 1.2,
    ease: "power3.inOut",
    delay: delay,
  })
    .fromTo(selector2, 
      { y: -80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.inOut",
      }, "-=1.2"
    )
    .to(selector2, {
      y: -80,
      opacity: 0,
      duration: 1.2,
      ease: "power3.inOut",
      delay: delay,
    })
    .fromTo(selector1,
      { y: -80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.inOut",
      }, "-=1.2"
    );
}
*/
