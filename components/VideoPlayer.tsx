"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
}

export default function VideoPlayer({ videoUrl, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // Auto-play when video is loaded
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Video autoplay failed:", err);
      });
    }
  }, [videoUrl]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 text-sm font-medium tracking-wide"
        >
          CLOSE ✕
        </button>

        {/* Video player */}
        <div className="bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-auto"
            playsInline
            loop
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Download link */}
        <div className="mt-4 flex justify-center">
          <a
            href={videoUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs"
          >
            DOWNLOAD VIDEO
          </a>
        </div>
      </div>
    </div>
  );
}
