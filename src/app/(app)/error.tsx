'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

// Friendly error boundary for the authenticated app. Surfaces runtime errors
// (instead of a blank screen) with a retry, so problems are visible.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button onClick={reset} className="btn-primary mt-5">
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
