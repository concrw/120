"use client";

import { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 mb-6 rounded-2xl bg-secondary-100 flex items-center justify-center text-secondary-400">
          {icon}
        </div>
      )}
      <h3 className="text-heading-md text-secondary-900 mb-2">{title}</h3>
      {description && (
        <p className="text-body-md text-secondary-500 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset empty states
export function NoAvatarsEmpty({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <EmptyState
      icon={<UserIcon className="w-8 h-8" />}
      title="No avatars yet"
      description="Create your first AI fashion avatar to get started with video generation."
      action={{
        label: "Create Avatar",
        onClick: onCreateClick,
      }}
    />
  );
}

export function NoProductsEmpty({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <EmptyState
      icon={<ShirtIcon className="w-8 h-8" />}
      title="No products uploaded"
      description="Upload your first product image to start creating fashion videos."
      action={{
        label: "Upload Product",
        onClick: onUploadClick,
      }}
    />
  );
}

export function NoVideosEmpty({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <EmptyState
      icon={<VideoIcon className="w-8 h-8" />}
      title="No videos generated"
      description="Create your first AI-powered fashion video to showcase your products."
      action={{
        label: "Generate Video",
        onClick: onCreateClick,
      }}
    />
  );
}

// Icons
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ShirtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12v7.5h4.5V12l1.64-1.64a6 6 0 001.676-3.257l.319-1.913-3.375 1.125a6 6 0 01-3.02 0L6.115 5.19z" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
