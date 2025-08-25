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
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4",
    xl: "w-6 h-6"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`flex items-center ${sizeClasses[size]}`}>
        <div 
          className={`${dotSizeClasses[size]} bg-foreground rounded-full animate-[bounce_1.4s_ease-in-out_infinite] [animation-delay:-0.32s]`}
        />
        <div 
          className={`${dotSizeClasses[size]} bg-foreground rounded-full animate-[bounce_1.4s_ease-in-out_infinite] [animation-delay:-0.16s]`}
        />
        <div 
          className={`${dotSizeClasses[size]} bg-foreground rounded-full animate-[bounce_1.4s_ease-in-out_infinite]`}
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;