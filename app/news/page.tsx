'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewsPage() {
  const router = useRouter();
  
  const { data, isLoading } = useQuery({
    queryKey: ['news', 'first'],
    queryFn: async () => {
      const res = await fetch('/api/news?limit=1');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.data?.[0]) {
      console.log('[NewsPage] 🔄 Redirecting to first news:', data.data[0].id);
      router.push(`/news/${data.data[0].id}`);
    }
  }, [data, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-8 text-center">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select a news item</h2>
        <p className="text-muted-foreground">
          Choose a news article from the left panel to view details
        </p>
      </div>
    </div>
  );
}
