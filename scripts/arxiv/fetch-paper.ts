import { fetchArxivPaper } from '../../src/lib/arxiv';
import { prisma } from '../../src/lib/prisma';

const args = process.argv.slice(2);
const targetArxivId = args[0];

async function fetchPaper(arxivId: string) {
  console.log('='.repeat(60));
  console.log(`开始获取论文 arXiv 数据: ${arxivId}`);
  console.log('='.repeat(60));

  let paper = await prisma.arxivPaper.findUnique({
    where: { arxivId },
  });

  if (!paper) {
    console.log(`论文 ${arxivId} 不存在于数据库中，正在创建...`);
    paper = await prisma.arxivPaper.create({
      data: {
        arxivId,
        arxivUrl: `https://arxiv.org/abs/${arxivId}`,
        arxivDataStatus: 'pending',
      },
    });
    console.log(`论文 ${arxivId} 已创建`);
  }

  console.log(`\n[${1}/1] 获取论文 arXiv 数据: ${paper.arxivId}`);
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
  console.log('\n' + '='.repeat(60));
  console.log('论文 arXiv 数据获取完成');
  console.log('='.repeat(60));
}

if (!targetArxivId) {
  console.error('错误: 请提供 arXiv ID');
  console.error('用法: pnpm run fetch-paper <arxivId>');
  console.error('示例: pnpm run fetch-paper 2503.15888');
  process.exit(1);
}

fetchPaper(targetArxivId)
  .catch((e: unknown) => {
    console.error('\n发生未捕获的错误:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
