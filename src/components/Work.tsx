import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

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
    let padding: number =
      parseInt(window.getComputedStyle(box[0]).padding) / 2;
    translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;
  }

  setTranslateX();

  let timeline = gsap.timeline({
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

  // Clean up (optional, good practice)
  return () => {
    timeline.kill();
    ScrollTrigger.getById("work")?.kill();
  };
}, []);
  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {[...Array(6)].map((_value, index) => (
            <div className="work-box" key={index}>
              <div className="work-info">
                <div className="work-title">
                  <h3>0{index + 1}</h3>

                  <div>
                    <h4>{index === 0 ? "OmniGenesis" : index === 1 ? "DGFari Learn" : index === 2 ? "N.O.V.A." : index === 3 ? "Simple Charm" : index === 4 ? "Phoenix" : index === 5 ? "eduCLaaS TaskMate" : "Project Name"}</h4>
                    <p>{index === 0 ? "Agentic AI SaaS Startup" : index === 1 ? "Personal Development Blog" : index === 2 ? "AI Product Analytics" : index === 3 ? "Luxury E-Commerce Brand" : index === 4 ? "Burnout Companion" : index === 5 ? "School Productivity Web App" : "Category"}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{index === 0 ? "Tailwind CSS, Node.js, Express, MongoDB" : index === 1 ? "Python, Flask, Werkzeug, Jinja2" : index === 2 ? "HTML5, CSS3, Vanilla JS, Chart.js" : index === 3 ? "Pantheon, SureCart, Tidio, Mailchimp" : index === 4 ? "Blender, HTML, CSS, JavaScript" : index === 5 ? "Python, Flask, HTML/JS, Custom CSS" : "Javascript, TypeScript, React, Threejs"}</p>
              </div>
              <WorkImage 
                image="/images/placeholder.webp" 
                alt="" 
                video={index === 0 ? "/videos/OmniGenesis.mp4" : index === 1 ? "/videos/DGFari Learn.mp4" : index === 2 ? "/videos/NOVA.mp4" : index === 3 ? "/videos/Simple Charm.mp4" : index === 4 ? "/videos/Phoenix.mp4" : index === 5 ? "/videos/eduCLaaS TaskMate.mp4" : undefined}
                videoLeft={index === 0 ? -1 : index === 1 ? -30 : index === 2 ? -30 : index === 3 ? -30 : index === 4 ? -30 : index === 5 ? -30 : 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Work;
