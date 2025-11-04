import Footer from "@/components/Footer";
import { useAnonymousTracking } from "@/hooks/useAnonymousTracking";
import { useRef } from "react";

const Index = () => {
  useAnonymousTracking('homepage');
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <>
      {/* Vidéo principale - AI Powered */}
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          onClick={toggleVideo}
          className="w-full h-[50vh] md:h-screen object-contain cursor-pointer"
        >
          <source src="/cuizly-ai-powered.mp4" type="video/mp4" />
        </video>
      </div>
      <Footer />
    </>
  );
};

export default Index;