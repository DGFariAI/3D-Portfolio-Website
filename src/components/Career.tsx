import "./styles/Career.css";
import { useEffect } from "react";
import { setAllTimeline } from "./utils/GsapScroll";

const Career = () => {
  useEffect(() => {
    setAllTimeline();
  }, []);
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My education <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Customer Service Representative</h4>
                <h5>Amazon</h5>
              </div>
              <h3>2024</h3>
            </div>
            <p>
              Provided top-quality customer support to North American
              retail clients, consistently exceeding expectations and 
              earning recognition for performance and dedication.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Digital Business Student</h4>
                <h5>Lithan Academy Singapore</h5>
              </div>
              <h3>2025</h3>
            </div>
            <p>
              Learning and applying real-world startup strategies and
              skills in entrepreneurship, branding, software,
              and AI to build purpose-driven, impactful ventures/products.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Global Marketing Associate</h4>
                <h5>eduCLaaS Pte Ltd</h5>
              </div>
              <h3>NOW</h3>
            </div>
            <p>
              Contributed to the growth of the company's global presence by
              developing and executing marketing strategies across multiple
              countries, driving brand awareness and customer acquisition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
