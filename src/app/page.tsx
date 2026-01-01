'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/stat-card';
import { NetworkGraph } from '@/components/network-graph';
import { LoadingBar } from '@/components/loading-bar';
import type { ExportedData } from '@/types/data';

export default function Home() {
  const [data, setData] = useState<ExportedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data.json', {
          cache: 'force-cache',
        });

        if (!response.ok) {
          throw new Error('数据加载失败');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('数据加载失败，请确保已运行导出脚本');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <LoadingBar isLoading={isLoading} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
            </div>
            <h2 className="text-2xl font-semibold text-black mb-2">
              正在加载数据...
            </h2>
            <p className="text-lg text-zinc-600">
              文件较大，请稍候
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black mb-4">
            数据未找到
          </h1>
          <p className="text-lg text-zinc-600 mb-4">
            {error || '请先运行数据导出脚本: pnpm run export-data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <LoadingBar isLoading={false} />
      <div className="swiss-container">
        <header className="mb-12">
          <h1 className="text-6xl font-semibold text-black swiss-text-left mb-4">
            Connected Papers
          </h1>
          <p className="text-xl text-zinc-600 swiss-text-left">
            学术文献关系网络可视化
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard label="作者" value={data.statistics.authorCount} />
          <StatCard label="文献" value={data.statistics.paperCount} />
          <StatCard label="期刊" value={data.statistics.venueCount} />
        </section>

        <section className="bg-white border border-black p-8">
          <h2 className="text-2xl font-semibold text-black mb-6 swiss-text-left">
            关系网络
          </h2>
          <div className="h-[800px]">
            <NetworkGraph data={data.network} />
          </div>
        </section>

        <footer className="mt-12 text-center text-zinc-600">
          <p>使用 D3.js 和 Next.js 构建</p>
        </footer>
      </div>
    </div>
  );
}
