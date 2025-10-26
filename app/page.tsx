'use client';

import { NewsList } from '@/components/NewsList';
import { AggregatePanel } from '@/components/AggregatePanel';
import { NewsDetailView } from '@/components/NewsDetailView';
import { useState } from 'react';
import type { News } from '@/lib/schemas';

export default function HomePage() {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  
  const handleSelectNews = (news: News) => {
    console.log('[HomePage] 📰 Selected news:', news.id);
    setSelectedNews(news);
  };

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
              onSelectNews={handleSelectNews}
              selectedNewsId={selectedNews?.id}
            />
          </div>
        </div>

        {/* Center: Selected News Preview (50%) */}
        <div className="md:col-span-6 md:border-r md:border-border">
          <div className="h-full overflow-y-auto">
            {selectedNews ? (
              <NewsDetailView newsId={selectedNews.id} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
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
          {selectedNews ? (
            <>
              <NewsDetailView newsId={selectedNews.id} />
              <button 
                onClick={() => setSelectedNews(null)}
                className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg z-50"
              >
                ← Back to list
              </button>
            </>
          ) : (
            <NewsList 
              onSelectNews={handleSelectNews}
              selectedNewsId={undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}