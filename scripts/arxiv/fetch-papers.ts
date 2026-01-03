import { fetchArxivPaper } from '../../src/lib/arxiv';
import { prisma } from '../../src/lib/prisma';

async function fetchPapers() {
  console.log('='.repeat(60));
  console.log('开始批量获取论文 arXiv 数据...');
  console.log('='.repeat(60));

  const papersToFetch = await prisma.arxivPaper.findMany({
    where: {
      arxivDataStatus: 'pending',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (papersToFetch.length === 0) {
    console.log('没有待获取 arXiv 数据的论文');
    return;
  }

  console.log(`找到 ${papersToFetch.length} 篇待获取 arXiv 数据的论文`);
  console.log('='.repeat(60));

  for (const paper of papersToFetch) {
    console.log(
      `\n[${papersToFetch.indexOf(paper) + 1}/${papersToFetch.length}] 获取论文 arXiv 数据: ${paper.arxivId}`,
    );
    console.log('-'.repeat(60));

    try {
      console.log(`更新状态为: processing`);
      await prisma.arxivPaper.update({
        where: { id: paper.id },
        data: { arxivDataStatus: 'processing' },
      });

      const arxivData = await fetchArxivPaper(paper.arxivId);

      console.log(`保存论文数据到数据库...`);
      await prisma.arxivPaper.update({
        where: { id: paper.id },
        data: {
          title: arxivData.title,
          abstract: arxivData.abstract,
          publishedDate: arxivData.publishedDate,
          primaryCategory: arxivData.primaryCategory,
          license: arxivData.license,
          updatedAtArxiv: arxivData.updatedAtArxiv,
          comment: arxivData.comment,
          journalRef: arxivData.journalRef,
          doi: arxivData.doi,
          arxivDataStatus: 'completed',
          arxivDataFetchedAt: new Date(),
        },
      });

      console.log(`保存作者信息...`);
      for (const author of arxivData.authors) {
        await prisma.arxivAuthorName.create({
          data: {
            name: author.name,
            affiliation: author.affiliation,
            arxivPaperId: paper.id,
          },
        });
      }

      console.log(`保存分类信息...`);
      for (const category of arxivData.categories) {
        await prisma.arxivCategory.create({
          data: {
            category,
            arxivPaperId: paper.id,
          },
        });
      }

      console.log(`论文 arXiv 数据获取完成: ${paper.arxivId}`);
    } catch (error) {
      console.error(`\n论文 arXiv 数据获取失败: ${paper.arxivId}`);
      console.error(`错误信息:`, error);

      await prisma.arxivPaper.update({
        where: { id: paper.id },
        data: { arxivDataStatus: 'failed' },
      });

      console.error(`状态已更新为: failed`);
    }

    console.log('-'.repeat(60));
  }

  console.log('\n' + '='.repeat(60));
  console.log('所有论文 arXiv 数据获取完成');
  console.log('='.repeat(60));
}

fetchPapers()
  .catch((e: unknown) => {
    console.error('\n发生未捕获的错误:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
