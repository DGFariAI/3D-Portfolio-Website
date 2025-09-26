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
  // Scroll to top on page refresh/reload - Enhanced version 
  useEffect(() => {
    // Disable automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Immediate scroll to top - call this first
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      // Also set document level scroll position
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // Apply immediately
    scrollToTop();
    
    // Also handle on load in case it didn't work
    const handleLoad = () => {
      scrollToTop();
    };
    
    // Handle popstate for browser navigation
    const handlePopState = () => {
      scrollToTop();
    };
    
    // Handle page show (including refresh)  
    const handlePageShow = (event: PageTransitionEvent) => {
      // Force scroll to top on any page show event, especially refresh
      scrollToTop();
      if ((event as any).persisted) {
        scrollToTop();
      }
    };
    
    // Handle beforeunload to set a flag for refresh detection
    const handleBeforeUnload = () => {
      // Force scroll to top just before navigation
      scrollToTop();
    };
    
    // Add event listeners with better timing
    window.addEventListener('load', handleLoad); 
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow as any);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also set a small delay scroll after component mount
    const timeoutId = setTimeout(() => {
      scrollToTop();
    }, 100);

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow as any);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};

export default App;
