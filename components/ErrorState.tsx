'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="font-medium text-sm mb-2 text-red-500">Error</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs">
        {message}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </Button>
      )}
    </div>
  );
}
