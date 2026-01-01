import { StatCard } from '@/components/stat-card';
import { NetworkGraph } from '@/components/network-graph';
import type { ExportedData } from '@/types/data';

async function getData(): Promise<ExportedData | null> {
  try {
    const response = await fetch('/data.json', {
      cache: 'force-cache',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('加载数据失败:', error);
    return null;
  }
}

export default async function Home() {
  const data = await getData();

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black mb-4">
            数据未找到
          </h1>
          <p className="text-lg text-zinc-600">
            请先运行数据导出脚本: pnpm run export-data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
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
