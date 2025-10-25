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
        <div className="h-screen flex flex-col">
          {/* Mobile Header */}
          <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <h1 className="text-lg font-semibold">Crypto News Oracle</h1>
            <p className="text-xs text-muted-foreground">AI-powered market predictions</p>
          </div>
          
          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="feed" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
                <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
                <TabsTrigger value="verdict" className="text-xs">Verdict</TabsTrigger>
                <TabsTrigger value="tomorrow" className="text-xs">Tomorrow</TabsTrigger>
              </TabsList>
              
              <TabsContent value="feed" className="flex-1 overflow-hidden px-4">
                <div className="h-full pt-2">
                  <NewsList 
                    onSelectNews={setSelectedNews}
                    selectedNewsId={selectedNews?.id}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="verdict" className="flex-1 overflow-hidden px-4">
                <div className="h-full overflow-y-auto pt-2">
                  {children}
                </div>
              </TabsContent>
              
              <TabsContent value="tomorrow" className="flex-1 overflow-hidden px-4">
                <div className="h-full overflow-y-auto pt-2">
                  <AggregatePanel />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
