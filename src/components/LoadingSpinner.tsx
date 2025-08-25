interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const LoadingSpinner = ({ 
  size = "md", 
  className = ""
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} logo-pulse`}>
        <img 
          src="/lovable-uploads/a2dcf041-7862-45d2-b5dd-b0f469cf625f.png" 
          alt="Chargement..." 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;