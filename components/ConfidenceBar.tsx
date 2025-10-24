'use client';

interface ConfidenceBarProps {
  confidence: number;
  label?: string;
  className?: string;
}

export function ConfidenceBar({ confidence, label, className }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);
  
  const getColorClass = (conf: number) => {
    if (conf >= 0.7) return 'bg-green-500';
    if (conf >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass(confidence)}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${percentage}%`}
        />
      </div>
    </div>
  );
}
