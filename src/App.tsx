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
  // Scroll to top on page refresh/reload
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    
    // Also handle browser back/forward navigation
    const handlePopState = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if ((event as any).persisted) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow as any);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow as any);
    };
  }, []);

  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};

export default App;
