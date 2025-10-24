'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NewsCard } from './NewsCard';
import { EmptyState } from './EmptyState';
import { Skeletons } from './Skeletons';
import type { News } from '@/lib/schemas';

interface NewsListProps {
  onSelectNews: (news: News) => void;
  selectedNewsId?: string;
}

export function NewsList({ onSelectNews, selectedNewsId }: NewsListProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: news, isLoading, error } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const response = await fetch('/api/news?limit=50');
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      return data.data as News[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!news || news.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => Math.min(prev + 1, news.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case 'ArrowRight':
          e.preventDefault();
          if (news[activeIndex]) {
            onSelectNews(news[activeIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [news, activeIndex, onSelectNews]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && news && news.length > 0) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    }
  }, [activeIndex, news]);

  if (isLoading) {
    return <Skeletons />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-500 text-center">
          Failed to load news. Please try again.
        </div>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return <EmptyState />;
  }

  return (
    <div 
      ref={listRef}
      className="h-full overflow-y-auto"
      role="list"
      aria-label="News list"
    >
      {news.map((item, index) => (
        <div
          key={item.id}
          role="listitem"
          className={`
            ${index === activeIndex ? 'ring-2 ring-primary' : ''}
            transition-all duration-200
          `}
        >
          <NewsCard
            news={item}
            onClick={() => onSelectNews(item)}
            isSelected={item.id === selectedNewsId}
            isActive={index === activeIndex}
          />
        </div>
      ))}
    </div>
  );
}
