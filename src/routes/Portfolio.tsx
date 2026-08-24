import { useEffect } from "react";
import MainContainer from "../components/MainContainer";
import Loading from "../components/Loading";
import { LoadingProvider, useLoading } from "../context/LoadingProvider";
import SEO from "../components/SEO";

/**
 * The portfolio, and everything that belongs only to it.
 *
 * The welcome sequence used to wrap the whole app from App.tsx. It lives here
 * now so that the hub at `/` never pays for it: the intro is a deliberate few
 * seconds of pacing, which is right for a portfolio someone chose to enter and
 * wrong for the page every link points at.
 */
const PortfolioContent = () => {
  const { isLoading, setLoading } = useLoading();

  useEffect(() => {
    setLoading(100);
  }, [setLoading]);

  useEffect(() => {
    const root = document.documentElement;
    if (isLoading) {
      root.classList.add("no-scrollbar");
    } else {
      root.classList.remove("no-scrollbar");
    }
    return () => {
      root.classList.remove("no-scrollbar");
    };
  }, [isLoading]);

  // The document is locked (body overflow hidden) while the loading screen is
  // up, so a pending scroll restoration from a refresh cannot apply yet: it
  // lands the instant the screen unmounts and yanks the visitor into the middle
  // of the page. This is the moment that actually matters, so claim the top
  // here rather than only at mount.
  useEffect(() => {
    if (isLoading) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [isLoading]);

  return (
    <>
      <SEO
        title="Danica Gabriella | Kingdom Builder & Marketer"
        description="Faith-driven innovator creating meaningful solutions through brand storytelling, AI, and purpose-driven technology."
        path="/portfolio"
      />
      {isLoading && <Loading />}
      <MainContainer />
    </>
  );
};

const Portfolio = () => (
  <LoadingProvider>
    <PortfolioContent />
  </LoadingProvider>
);

export default Portfolio;
