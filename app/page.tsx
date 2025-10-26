'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { NewsList } from '@/components/NewsList';
import { AggregatePanel } from '@/components/AggregatePanel';
import { useState } from 'react';
import type { News } from '@/lib/schemas';

export default function HomePage() {
  const router = useRouter();
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  
  // Fetch first news to redirect to details
  const { data, isLoading } = useQuery({
    queryKey: ['news', 'first'],
    queryFn: async () => {
      const res = await fetch('/api/news?limit=1');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop 3-column layout */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:h-screen md:pt-0">
        {/* Left: News List (30%) */}
        <div className="md:col-span-3 md:border-r md:border-border">
          <div className="h-full">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm">News Feed</h2>
            </div>
            <NewsList 
              onSelectNews={(news) => {
                setSelectedNews(news);
                router.push(`/news/${news.id}`);
              }}
              selectedNewsId={selectedNews?.id}
            />
          </div>
        </div>

        {/* Center: Selected News Preview (50%) */}
        <div className="md:col-span-6 md:border-r md:border-border">
          <div className="h-full overflow-y-auto p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Select a news item</h2>
                  <p className="text-muted-foreground">
                    Choose a news article from the left panel to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Aggregate Panel (20%) */}
        <div className="md:col-span-3">
          <div className="h-full overflow-y-auto p-4">
            <AggregatePanel />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="h-screen overflow-y-auto">
          <NewsList 
            onSelectNews={(news) => {
              setSelectedNews(news);
              router.push(`/news/${news.id}`);
            }}
            selectedNewsId={selectedNews?.id}
          />
        </div>
      </div>
    </div>
  );
}