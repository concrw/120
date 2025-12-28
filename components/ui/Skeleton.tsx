"use client";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "shimmer";
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", variant = "shimmer", style }: SkeletonProps) {
  const baseClasses = "rounded-lg";
  const variantClasses =
    variant === "shimmer"
      ? "relative overflow-hidden bg-secondary-100 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-shimmer before:bg-[length:200%_100%]"
      : "bg-secondary-200 animate-pulse";

  return <div className={`${baseClasses} ${variantClasses} ${className}`} style={style} />;
}

// Preset skeleton components
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-secondary-200 p-6 ${className}`}>
      <Skeleton className="h-48 w-full mb-4 rounded-xl" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

export function SkeletonImage({ className = "", aspectRatio = "16/9" }: { className?: string; aspectRatio?: string }) {
  return (
    <Skeleton
      className={`w-full ${className}`}
      style={{ aspectRatio }}
    />
  );
}
