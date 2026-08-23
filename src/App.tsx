import { useEffect } from "react";
import "./App.css";
import MainContainer from "./components/MainContainer";
import Loading from "./components/Loading";
import { LoadingProvider, useLoading } from "./context/LoadingProvider";

const AppContent = () => {
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

  return (
    <>
      {isLoading && <Loading />}
      <MainContainer></MainContainer>
    </>
  );
};

const App = () => {
  // Land at the top on every entry: reload, back/forward, and bfcache restore.
  // This used to be four overlapping listeners plus a timeout, all racing each
  // other and a duplicate copy in LoadingProvider. `scrollRestoration = manual`
  // plus one handler covers the same cases.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    scrollToTop();
    window.addEventListener('pageshow', scrollToTop);
    return () => window.removeEventListener('pageshow', scrollToTop);
  }, []);

  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};

export default App;
