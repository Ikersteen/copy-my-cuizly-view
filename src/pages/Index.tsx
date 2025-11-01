import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <div className="min-h-screen w-full bg-background">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-screen object-cover"
        >
          <source src="/cuizly-products-video.mp4" type="video/mp4" />
        </video>
      </div>
      <Footer />
    </>
  );
};

export default Index;