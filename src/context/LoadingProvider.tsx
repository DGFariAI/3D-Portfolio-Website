import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  interface LoadingType {
    isLoading: boolean;
    setIsLoading: (state: boolean) => void;
    setLoading: (percent: number) => void;
    loading: number;
  }
  
  export const LoadingContext = createContext<LoadingType | null>(null);
  
    export const LoadingProvider = ({ children }: PropsWithChildren) => {
    const [isLoading, setIsLoading] = useState(true);
    const [loading, setLoading] = useState(0);

    // Disabled fallback mechanism to prevent conflicts with external loading
    // The Character Scene component handles all loading progress

    const value = {
      isLoading,
      setIsLoading,
      setLoading,
      loading,
    };
  
      return (
    <LoadingContext.Provider value={value as LoadingType}>
      <main className="main-body">{children}</main>
    </LoadingContext.Provider>
  );
  };
  
  export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
      throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
  };