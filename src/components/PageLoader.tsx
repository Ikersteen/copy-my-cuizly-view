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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="xl" />
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