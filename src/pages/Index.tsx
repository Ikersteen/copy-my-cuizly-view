import Footer from "@/components/Footer";
import { useAnonymousTracking } from "@/hooks/useAnonymousTracking";

const Index = () => {
  useAnonymousTracking('homepage');

  return (
    <>
      {/* Vidéo principale - AI Powered */}
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-[50vh] md:h-screen object-contain"
        >
          <source src="/cuizly-ai-powered.mp4" type="video/mp4" />
        </video>
      </div>
      <Footer />
    </>
  );
};

export default Index;