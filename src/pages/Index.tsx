const Index = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="max-w-full max-h-screen"
      >
        <source src="/cuizly-products-video.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default Index;