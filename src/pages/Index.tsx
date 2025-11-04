import Footer from "@/components/Footer";
import { useAnonymousTracking } from "@/hooks/useAnonymousTracking";

const Index = () => {
  useAnonymousTracking('homepage');

  return (
    <>
      <div className="min-h-screen w-full bg-background">
        {/* Page content without videos */}
      </div>
      <Footer />
    </>
  );
};

export default Index;