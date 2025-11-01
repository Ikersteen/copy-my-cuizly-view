import { useRef, useState } from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

const Index = () => {
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

  return (
    <>
      <div className="min-h-screen w-full bg-background relative">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-screen object-cover"
        >
          <source src="/cuizly-products-video.mp4" type="video/mp4" />
        </video>
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