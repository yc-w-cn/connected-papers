import { fetchArxivPaper } from '../src/lib/arxiv';
import { prisma } from '../src/lib/prisma';

const args = process.argv.slice(2);
const targetArxivId = args[0];

async function processPendingPapers() {
  console.log('='.repeat(60));
  if (targetArxivId) {
    console.log(`开始处理指定论文: ${targetArxivId}`);
  } else {
    console.log('开始处理待处理论文...');
  }
  console.log('='.repeat(60));

  let papersToProcess;

  if (targetArxivId) {
    const paper = await prisma.paper.findUnique({
      where: { arxivId: targetArxivId },
    });

    if (!paper) {
      console.log(`论文 ${targetArxivId} 不存在于数据库中，正在创建...`);
      const newPaper = await prisma.paper.create({
        data: {
          arxivId: targetArxivId,
          arxivUrl: `https://arxiv.org/abs/${targetArxivId}`,
          status: 'pending',
        },
      });
      console.log(`论文 ${targetArxivId} 已创建`);
      papersToProcess = [newPaper];
    } else {
      papersToProcess = [paper];
    }
  } else {
    papersToProcess = await prisma.paper.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (papersToProcess.length === 0) {
      console.log('没有待处理的论文');
      return;
    }
  }

  console.log(`找到 ${papersToProcess.length} 篇待处理论文`);
  console.log('='.repeat(60));

  for (const paper of papersToProcess) {
    console.log(
      `\n[${papersToProcess.indexOf(paper) + 1}/${papersToProcess.length}] 处理论文: ${paper.arxivId}`,
    );
    console.log('-'.repeat(60));

    try {
      console.log(`更新状态为: processing`);
      await prisma.paper.update({
        where: { id: paper.id },
        data: { status: 'processing' },
      });

      const arxivData = await fetchArxivPaper(paper.arxivId);

      console.log(`保存论文数据到数据库...`);
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
      console.error(`\n论文处理失败: ${paper.arxivId}`);
      console.error(`错误信息:`, error);

      await prisma.paper.update({
        where: { id: paper.id },
        data: { status: 'failed' },
      });

      console.error(`状态已更新为: failed`);
    }

    console.log('-'.repeat(60));
  }

  console.log('\n' + '='.repeat(60));
  console.log('所有论文处理完成');
  console.log('='.repeat(60));
}

processPendingPapers()
  .catch((e: unknown) => {
    console.error('\n发生未捕获的错误:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
