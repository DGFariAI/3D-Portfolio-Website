import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";
import Marquee from "react-fast-marquee";

const Loading = () => {
  const { setIsLoading, loading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    console.log("Loading percentage:", loading);
    if (loading >= 100) {
      console.log("Loading reached 100%, starting transition sequence");
      // Balanced timing - not too fast, not too slow
      setTimeout(() => {
        setLoaded(true);
        setTimeout(() => {
          setIsLoaded(true);
        }, 1000); // Balanced delay
      }, 800); // Balanced delay
    }
  }, [loading]);

  useEffect(() => {
    if (isLoaded && loading >= 100) {
      console.log("Setting clicked to true, loading:", loading);
      import("./utils/initialFX").then((module) => {
        setClicked(true);
        setTimeout(() => {
          if (module.initialFX) {
            module.initialFX();
          }
          // Wait for the loading-clicked transition to complete before hiding loading screen
          setTimeout(() => {
            setIsLoading(false);
          }, 700); // Balanced timing - not too fast, not too slow
        }, 700); // Balanced timing - not too fast, not too slow
      });
    }
  }, [isLoaded, loading, setIsLoading]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className="loading-screen">
        <div className={`loading-logo ${clicked && "loading-logo-hidden"}`}>
          <img src="/itsdgfari_icon.svg" alt="itsdgfari logo" />
        </div>
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{loading}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent: number = 0;

  let interval = setInterval(() => {
    if (percent <= 50) {
      let rand = Math.round(Math.random() * 5);
      percent = percent + rand;
      setLoading(percent);
    } else {
      clearInterval(interval);
      interval = setInterval(() => {
        percent = percent + Math.round(Math.random());
        setLoading(percent);
        if (percent > 91) {
          clearInterval(interval);
        }
      }, 2000);
    }
  }, 100);

  function clear() {
    clearInterval(interval);
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      clearInterval(interval);
      interval = setInterval(() => {
        if (percent < 100) {
          percent++;
          setLoading(percent);
        } else {
          resolve(percent);
          clearInterval(interval);
        }
      }, 2);
    });
  }
  return { loaded, percent, clear };
};