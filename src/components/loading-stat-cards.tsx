'use client';

import { useEffect, useState, useRef } from 'react';

interface LoadingStatCardsProps {
  progress: number;
  targetValues: {
    authorCount: number;
    paperCount: number;
    venueCount: number;
  };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function LoadingStatCards({ progress, targetValues }: LoadingStatCardsProps) {
  const [displayValues, setDisplayValues] = useState({
    authorCount: 0,
    paperCount: 0,
    venueCount: 0,
  });
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      const easedProgress = easeOutCubic(progress / 100);
      
      setDisplayValues({
        authorCount: Math.round(targetValues.authorCount * easedProgress),
        paperCount: Math.round(targetValues.paperCount * easedProgress),
        venueCount: Math.round(targetValues.venueCount * easedProgress),
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress, targetValues]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="flex flex-col items-start p-8 bg-white border border-black">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
          <span className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            作者
          </span>
        </div>
        <span className="text-6xl font-semibold text-black mt-2">
          {displayValues.authorCount.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col items-start p-8 bg-white border border-black">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
          <span className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            文献
          </span>
        </div>
        <span className="text-6xl font-semibold text-black mt-2">
          {displayValues.paperCount.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col items-start p-8 bg-white border border-black">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            期刊
          </span>
        </div>
        <span className="text-6xl font-semibold text-black mt-2">
          {displayValues.venueCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
