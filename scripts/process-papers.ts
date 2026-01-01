import { prisma } from '../src/lib/prisma';

async function fetchArxivPaper(arxivId: string) {
  const response = await fetch(
    `https://export.arxiv.org/api/query?id_list=${arxivId}`,
  );
  const text = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');

  const entry = doc.querySelector('entry');
  if (!entry) {
    throw new Error('未找到论文数据');
  }

  const title = entry.querySelector('title')?.textContent?.trim();
  const summary = entry.querySelector('summary')?.textContent?.trim();
  const published = entry.querySelector('published')?.textContent;

  const authors: string[] = [];
  entry.querySelectorAll('author name').forEach((author) => {
    authors.push(author.textContent || '');
  });

  return {
    title,
    abstract: summary,
    authors: authors.join(', '),
    publishedDate: published?.split('T')[0],
  };
}

async function processPendingPapers() {
  console.log('开始处理待处理论文...');

  const pendingPapers = await prisma.paper.findMany({
    where: {
      status: 'pending',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (pendingPapers.length === 0) {
    console.log('没有待处理的论文');
    return;
  }

  console.log(`找到 ${pendingPapers.length} 篇待处理论文`);

  for (const paper of pendingPapers) {
    console.log(`正在处理论文: ${paper.arxivId}`);

    try {
      await prisma.paper.update({
        where: { id: paper.id },
        data: { status: 'processing' },
      });

      const arxivData = await fetchArxivPaper(paper.arxivId);

      await prisma.paper.update({
        where: { id: paper.id },
        data: {
          title: arxivData.title,
          authors: arxivData.authors,
          abstract: arxivData.abstract,
          publishedDate: arxivData.publishedDate,
          status: 'completed',
          processedAt: new Date(),
        },
      });

      console.log(`论文处理完成: ${paper.arxivId}`);
    } catch (error) {
      console.error(`论文处理失败: ${paper.arxivId}`, error);

      await prisma.paper.update({
        where: { id: paper.id },
        data: { status: 'failed' },
      });
    }
  }

  console.log('所有论文处理完成');
}

processPendingPapers()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
