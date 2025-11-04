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

      {/* Image 1 - Automation text */}
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center">
        <img 
          src="/cuizly-automation-text.jpg" 
          alt="We build intelligent tools that help restaurants efficiently automate the management of their establishments"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Vidéo 2 */}
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-[50vh] md:h-screen object-contain"
        >
          <source src="/cuizly-video-2.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Vidéo 3 */}
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-[50vh] md:h-screen object-contain"
        >
          <source src="/cuizly-video-3.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Vidéo 4 */}
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-[50vh] md:h-screen object-contain"
        >
          <source src="/cuizly-video-4.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Image 5 - Future of foodtech */}
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center">
        <img 
          src="/cuizly-future-foodtech.jpg" 
          alt="Let's build the future of foodtech together"
          className="w-full h-full object-contain"
        />
      </div>

      <Footer />
    </>
  );
};

export default Index;