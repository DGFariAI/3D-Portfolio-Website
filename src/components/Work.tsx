import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

// One row per card. This replaced six parallel chains of index ternaries, where
// adding or reordering a project meant editing the same index in six places and
// any mismatch silently paired the wrong copy with the wrong clip.
const PROJECTS = [
  {
    title: "OmniGenesis",
    category: "Agentic AI SaaS Startup",
    tools: "Tailwind CSS, Node.js, Express, MongoDB",
    video: "/videos/OmniGenesis.mp4",
    poster: "/images/posters/OmniGenesis.webp",
    videoLeft: -1,
  },
  {
    title: "DGFari Learn",
    category: "Personal Development Blog",
    tools: "Python, Flask, Werkzeug, Jinja2",
    video: "/videos/DGFari Learn.mp4",
    poster: "/images/posters/DGFari Learn.webp",
    videoLeft: -30,
  },
  {
    title: "N.O.V.A.",
    category: "AI Product Analytics",
    tools: "HTML5, CSS3, Vanilla JS, Chart.js",
    video: "/videos/NOVA.mp4",
    poster: "/images/posters/NOVA.webp",
    videoLeft: -30,
  },
  {
    title: "EcoCity",
    category: "Gamified Green Mobility App",
    tools: "React, TypeScript, Vite, Supabase",
    video: "/videos/EcoCity.mp4",
    poster: "/images/posters/EcoCity.webp",
    videoLeft: -30,
  },
  {
    title: "Simple Charm",
    category: "Luxury E-Commerce Brand",
    tools: "Pantheon, SureCart, Tidio, Mailchimp",
    video: "/videos/Simple Charm.mp4",
    poster: "/images/posters/Simple Charm.webp",
    videoLeft: -30,
  },
  {
    title: "Phoenix",
    category: "Burnout Companion",
    tools: "Blender, HTML, CSS, JavaScript",
    video: "/videos/Phoenix.mp4",
    poster: "/images/posters/Phoenix.webp",
    videoLeft: -30,
  },
];

const Work = () => {
  useEffect(() => {
  let translateX: number = 0;

  function setTranslateX() {
    const box = document.getElementsByClassName("work-box");
    const rectLeft = document
      .querySelector(".work-container")!
      .getBoundingClientRect().left;
    const rect = box[0].getBoundingClientRect();
    const parentWidth = box[0].parentElement!.getBoundingClientRect().width;
    const padding: number =
      parseInt(window.getComputedStyle(box[0]).padding) / 2;
    translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;
  }

  setTranslateX();

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".work-section",
      start: "top top",
      end: `+=${translateX}`, // Use actual scroll width
      scrub: true,
      pin: true,
      id: "work",
    },
  });

  timeline.to(".work-flex", {
    x: -translateX,
    ease: "none",
  });

  // Clean up. kill(true) REVERTS the pin, which unwraps the .pin-spacer this
  // trigger injected around .work-section. Without the revert flag the spacer
  // is left in the DOM, and the next mount (React StrictMode double-invokes
  // effects in dev) wraps a second spacer around the stale one — the nested
  // pair overflows the page and gives .main-body its own scrollbar.
  return () => {
    ScrollTrigger.getById("work")?.kill(true);
    timeline.kill();
  };
}, []);
  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {PROJECTS.map((project, index) => (
            <div className="work-box" key={project.title}>
              <div className="work-info">
                <div className="work-title">
                  <h3>0{index + 1}</h3>

                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.category}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{project.tools}</p>
              </div>
              <WorkImage
                image={project.poster}
                alt={`${project.title} preview`}
                video={project.video}
                videoLeft={project.videoLeft}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Work;
