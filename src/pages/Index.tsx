import Footer from "@/components/Footer";
import { useAnonymousTracking } from "@/hooks/useAnonymousTracking";
import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  useAnonymousTracking('homepage');
  const videoRef = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  useEffect(() => {
    const video3 = video3Ref.current;
    if (!video3) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && video3.paused) {
            video3.play();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video3);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Vidéo principale - AI Powered */}
      <div className="min-h-[85vh] md:min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block py-4 md:py-0">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          onClick={toggleVideo}
          className="w-full h-auto max-h-[80vh] md:max-h-screen object-contain cursor-pointer"
        >
          <source src="/cuizly-ai-powered.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Image 1 - Automation text */}
      <div className="min-h-[85vh] md:min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center py-4 md:py-0">
        <img 
          src="/cuizly-automation-text.jpg" 
          alt="We build intelligent tools that help restaurants efficiently automate the management of their establishments"
          className="w-full h-auto max-h-[80vh] md:max-h-screen object-contain"
        />
      </div>

      {/* Vidéo 2 - Zone "Try" cliquable */}
      <div className="min-h-[85vh] md:min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block py-4 md:py-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-auto max-h-[80vh] md:max-h-screen object-contain"
        >
          <source src="/cuizly-video-2.mp4" type="video/mp4" />
        </video>
        {/* Zone cliquable pour "Try" - positionnée sur le bouton noir dans la vidéo */}
        <a 
          href="https://www.cuizly.ca/cuizlyassistant"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[15%] w-36 h-14 md:w-44 md:h-16 cursor-pointer z-10 hover:opacity-75 transition-opacity"
          aria-label="Try Cuizly Assistant"
        />
      </div>

      {/* Vidéo 3 - Joue une seule fois au scroll */}
      <div className="min-h-[85vh] md:min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block py-4 md:py-0">
        <video 
          ref={video3Ref}
          muted 
          playsInline
          className="w-full h-auto max-h-[80vh] md:max-h-screen object-contain"
        >
          <source src="/cuizly-video-3.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Vidéo 4 */}
      <div className="min-h-[85vh] md:min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block py-4 md:py-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-auto max-h-[80vh] md:max-h-screen object-contain"
        >
          <source src="/cuizly-video-4.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Image 5 - Future of foodtech */}
      <div className="min-h-[85vh] md:min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center py-4 md:py-0">
        <img 
          src="/cuizly-future-foodtech.jpg" 
          alt="Let's build the future of foodtech together"
          className="w-full h-auto max-h-[80vh] md:max-h-screen object-contain"
        />
      </div>

      <Footer />
    </>
  );
};

export default Index;