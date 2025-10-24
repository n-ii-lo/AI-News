'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function Skeletons() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="w-16 h-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
