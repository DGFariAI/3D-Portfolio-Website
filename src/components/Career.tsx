import "./styles/Career.css";

const Career = () => {
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
                <h4>Independent<br />Artist</h4>
                <h5>DGFari Art</h5>
              </div>
              <h3>2023</h3>
            </div>
            <p>
              Created and sold artworks inspired by personal emotions
              and experiences, each piece carrying hidden meanings and
              stories that connected with and were cherished by others.
            </p>
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
              <h3>NOW</h3>
            </div>
            <p>
              Learning and applying real-world startup strategies and
              skills in entrepreneurship, digital marketing, branding,
              and AI to build purpose-driven, impactful ventures/products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
