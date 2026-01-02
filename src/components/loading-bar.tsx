'use client';

import { useEffect, useState, useRef } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
  progress?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function LoadingBar({ isLoading, progress }: LoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  const targetProgressRef = useRef(0);

  useEffect(() => {
    if (!isLoading) {
      targetProgressRef.current = 100;
    } else if (progress !== undefined) {
      targetProgressRef.current = progress;
    }

    const animate = (timestamp: number) => {
      setDisplayProgress((current) => {
        const diff = targetProgressRef.current - current;
        
        if (Math.abs(diff) < 0.1) {
          return targetProgressRef.current;
        }

        const speed = isLoading ? 0.05 : 0.15;
        const newValue = current + diff * speed;
        return newValue;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoading, progress]);

  return (
    <div className="w-full h-1 bg-zinc-200">
      <div
        className="h-full bg-black"
        style={{ width: `${displayProgress}%` }}
      />
    </div>
  );
}
