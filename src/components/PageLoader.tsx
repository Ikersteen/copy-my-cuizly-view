import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  minLoadTime?: number;
}

const PageLoader = ({ isLoading, children, minLoadTime = 500 }: PageLoaderProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, minLoadTime);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, minLoadTime]);

  if (isLoading || !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner 
            size="xl" 
            variant="enhanced" 
            withText={true}
            className="mb-8"
          />
          <div className="max-w-md mx-auto">
            <div className="h-4 loading-shimmer rounded mb-3"></div>
            <div className="h-4 loading-shimmer rounded mb-3 w-3/4 mx-auto"></div>
            <div className="h-4 loading-shimmer rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      {children}
    </div>
  );
};

export default PageLoader;