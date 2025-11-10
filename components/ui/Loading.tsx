interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div
      className={`${sizeClass[size]} border-white/20 border-t-white rounded-full animate-spin ${className}`}
    />
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`p-12 text-center ${className}`}>
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-white/60 text-sm uppercase tracking-wider">
        {message}
      </p>
    </div>
  );
}
