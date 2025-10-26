'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewsDetailView } from '@/components/NewsDetailView';

interface NewsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const [id, setId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);
  
  if (!id) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>
      </Button>
      
      <NewsDetailView newsId={id} />
    </div>
  );
}
