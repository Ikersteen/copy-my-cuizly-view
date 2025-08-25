interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const LoadingSpinner = ({ 
  size = "md", 
  className = ""
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "gap-1",
    md: "gap-1.5", 
    lg: "gap-2",
    xl: "gap-3"
  };

  const dotSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5",
    xl: "w-7 h-7"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`flex items-center ${sizeClasses[size]}`}>
        <div 
          className={`${dotSizeClasses[size]} bg-[hsl(var(--cuizly-primary))] rounded-full animate-[bounce_1.4s_ease-in-out_infinite] [animation-delay:-0.32s]`}
        />
        <div 
          className={`${dotSizeClasses[size]} bg-[hsl(var(--cuizly-primary))] rounded-full animate-[bounce_1.4s_ease-in-out_infinite] [animation-delay:-0.16s]`}
        />
        <div 
          className={`${dotSizeClasses[size]} bg-[hsl(var(--cuizly-primary))] rounded-full animate-[bounce_1.4s_ease-in-out_infinite]`}
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;