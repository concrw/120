"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4">!</h1>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-8">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {error.message && (
          <div className="border border-gray-300 bg-gray-50 p-4 mb-8 text-left">
            <p className="text-xs font-mono text-gray-600 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
