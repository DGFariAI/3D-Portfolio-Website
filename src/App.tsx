import { useEffect } from "react";
import "./App.css";
import CharacterModel from "./components/Character";
import MainContainer from "./components/MainContainer";
import Loading from "./components/Loading";
import { LoadingProvider, useLoading } from "./context/LoadingProvider";

const AppContent = () => {
  const { isLoading } = useLoading();
  
  return (
    <>
      {isLoading && <Loading />}
      <MainContainer>
        <CharacterModel />
      </MainContainer>
    </>
  );
};

const App = () => {
  // Scroll to top on page refresh/reload
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Also handle browser back/forward navigation
    const handlePopState = () => {
      window.scrollTo(0, 0);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};

export default App;
