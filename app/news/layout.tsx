'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewsList } from '@/components/NewsList';
import { AggregatePanel } from '@/components/AggregatePanel';
import type { News } from '@/lib/schemas';

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:h-screen md:pt-0">
        {/* Left: News List */}
        <div className="md:col-span-3 md:border-r md:border-border">
          <div className="h-full">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm">News Feed</h2>
            </div>
            <NewsList 
              onSelectNews={setSelectedNews}
              selectedNewsId={selectedNews?.id}
            />
          </div>
        </div>

        {/* Center: Selected News */}
        <div className="md:col-span-6 md:border-r md:border-border">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>

        {/* Right: Aggregate Panel */}
        <div className="md:col-span-3">
          <div className="h-full overflow-y-auto p-4">
            <AggregatePanel />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Tabs defaultValue="feed" className="h-screen flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="verdict">Verdict</TabsTrigger>
            <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feed" className="flex-1 overflow-hidden">
            <div className="h-full">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-sm">News Feed</h2>
              </div>
              <NewsList 
                onSelectNews={setSelectedNews}
                selectedNewsId={selectedNews?.id}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="verdict" className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </TabsContent>
          
          <TabsContent value="tomorrow" className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <AggregatePanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
