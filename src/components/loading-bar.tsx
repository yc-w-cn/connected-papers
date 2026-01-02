'use client';

import { useEffect, useState } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
  progress?: number;
}

export function LoadingBar({ isLoading, progress }: LoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setDisplayProgress(100);
      return;
    }

    if (progress !== undefined) {
      setDisplayProgress(progress);
    } else {
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isLoading, progress]);

  return (
    <div className="w-full h-1 bg-zinc-200">
      <div
        className="h-full bg-black transition-all duration-300 ease-out"
        style={{ width: `${displayProgress}%` }}
      />
    </div>
  );
}
