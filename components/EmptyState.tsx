'use client';

import { Newspaper } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Newspaper className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="font-medium text-sm mb-2">No news available</h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        No news match your filters. Try adjusting your search criteria or check back later.
      </p>
    </div>
  );
}
