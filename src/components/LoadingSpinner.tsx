interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "default" | "enhanced" | "pulse";
  withText?: boolean;
}

const LoadingSpinner = ({ 
  size = "md", 
  className = "", 
  variant = "enhanced",
  withText = false 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const variantClasses = {
    default: "animate-spin",
    enhanced: "logo-enhanced",
    pulse: "animate-pulse"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-300`}>
        <img 
          src="/lovable-uploads/a2dcf041-7862-45d2-b5dd-b0f469cf625f.png" 
          alt="Chargement..." 
          className="w-full h-full object-contain filter drop-shadow-lg"
        />
      </div>
      {withText && (
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm animate-pulse">
            Chargement en cours...
          </p>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;