"use client";

import { ReactNode } from "react";

type BadgeVariant = "primary" | "secondary" | "accent" | "success" | "warning" | "error";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-100 text-primary-700",
  secondary: "bg-secondary-100 text-secondary-700",
  accent: "bg-accent-100 text-accent-700",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  error: "bg-error-50 text-error-600",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className = "",
}: BadgeProps) {
  const classes = [
    "inline-flex items-center gap-1 font-medium rounded-full",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Status Badge with dot indicator
interface StatusBadgeProps {
  status: "active" | "pending" | "completed" | "failed" | "processing";
  children?: ReactNode;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "bg-success-500", label: "Active" },
  pending: { color: "bg-warning-500", label: "Pending" },
  completed: { color: "bg-success-500", label: "Completed" },
  failed: { color: "bg-error-500", label: "Failed" },
  processing: { color: "bg-accent-500", label: "Processing" },
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary-50 text-secondary-700 text-xs font-medium rounded-full">
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      {children || config.label}
    </span>
  );
}

// Credit Badge
interface CreditBadgeProps {
  credits: number;
  size?: "sm" | "md" | "lg";
}

const creditSizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export function CreditBadge({ credits, size = "md" }: CreditBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gradient-primary text-white font-semibold rounded-full shadow-glow-primary ${creditSizeClasses[size]}`}
    >
      <CoinIcon className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      {credits.toLocaleString()}
    </span>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472a4.265 4.265 0 01.264-.521z" />
    </svg>
  );
}
