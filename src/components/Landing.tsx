import { PropsWithChildren, useEffect, useState } from "react";
import "./styles/Landing.css";

const Landing = ({ children }: PropsWithChildren) => {
  const [isSwitched, setIsSwitched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        
        // Change text early in the animation (while letters are going up)
        setTimeout(() => {
          setIsSwitched(prev => !prev);
        }, 200); // Switch at 25% of animation (200ms of 800ms)
        
        // Reset animation state after completion
        setTimeout(() => {
          setIsAnimating(false);
        }, 800);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const renderAnimatedText = (text: string) => {
    return text.split('').map((letter, index) => (
      <span
        key={index}
        className={`letter ${isAnimating ? 'switching' : ''}`}
        style={{
          animationDelay: `${index * 0.05}s`
        }}
      >
        {letter}
      </span>
    ));
  };

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              DANICA
              <br />
              <span>GABRIELLA</span>
            </h1>
          </div>
          <div className="landing-info">
            <h3>A Product</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">
                <span className="switch-text">
                  {renderAnimatedText(isSwitched ? 'Designer' : 'Manager')}
                </span>
              </div>
              <div className="landing-h2-2"></div>
            </h2>
            <h2>
              <div className="landing-h2-info">
                <span className="switch-text">
                  {renderAnimatedText(isSwitched ? 'Manager' : 'Designer')}
                </span>
              </div>
              <div className="landing-h2-info-1"></div>
            </h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
