'use client';

import { ArrowLeft } from 'lucide-react';

export default function NewsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <ArrowLeft className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Select a news item</h2>
      <p className="text-muted-foreground max-w-md">
        Choose a news item from the feed to see AI-powered analysis and market predictions.
      </p>
      <div className="mt-6 text-xs text-muted-foreground">
        <p>Use ↑/↓ arrows to navigate, Enter to select</p>
      </div>
    </div>
  );
}
