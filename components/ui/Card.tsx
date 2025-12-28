"use client";

import { forwardRef, HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "hover" | "interactive";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white rounded-2xl border border-secondary-200 shadow-soft",
  hover: "bg-white rounded-2xl border border-secondary-200 shadow-soft transition-all duration-300 hover:shadow-medium hover:border-secondary-300 hover:-translate-y-1",
  interactive: "bg-white rounded-2xl border border-secondary-200 shadow-soft transition-all duration-300 hover:shadow-medium hover:border-secondary-300 hover:-translate-y-1 cursor-pointer active:scale-[0.99]",
};

const paddingClasses: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    const classes = [variantClasses[variant], paddingClasses[padding], className]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

function CardHeader({ title, subtitle, action, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`} {...props}>
      <div>
        <h3 className="text-heading-md text-secondary-900">{title}</h3>
        {subtitle && <p className="text-body-sm text-secondary-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-secondary-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardFooter, type CardProps };
