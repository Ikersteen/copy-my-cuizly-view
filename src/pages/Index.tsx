import { useRef, useState, useEffect } from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { useAnonymousTracking } from "@/hooks/useAnonymousTracking";

const Index = () => {
  useAnonymousTracking('homepage');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        toggleVideo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  return (
    <>
      <div className="min-h-screen md:h-screen w-full bg-background relative flex items-center justify-center md:block">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-[50vh] md:h-screen object-cover"
        >
          <source src="/cuizly-products-video.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 animate-fade-in">
            AI powered restaurants
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl animate-fade-in">
            Cuizly helps restaurants manage and fill their tables automatically.
          </p>
        </div>

        <Button
          onClick={toggleVideo}
          className="absolute bottom-8 right-8 rounded-full w-14 h-14 p-0"
          variant="secondary"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>
      </div>
      <Footer />
    </>
  );
};

export default Index;