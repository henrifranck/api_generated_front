"use client";

import { Button } from "@/src/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen p-4 pb-12 sm:p-6 md:p-8 font-sans flex flex-col items-center gap-8 bg-gray-50">
      <header className="w-full max-w-7xl sticky top-0 z-10 bg-white/80 backdrop-blur-sm py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
              My Projects
            </h1>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-red-100">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-800">
              Failed to Load Projects
            </h2>

            <p className="text-gray-600 text-sm">
              {error.message ||
                "An unexpected error occurred while fetching your projects."}
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>

              <Button
                onClick={() => reset()}
                className="bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 w-full">
              <p className="text-xs text-gray-500">
                Error code: {error.digest || "UNKNOWN"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
