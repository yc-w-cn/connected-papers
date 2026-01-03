import { prisma } from '../../src/lib/prisma';
import {
  createCitationRelation,
  saveCitationSemanticScholarData,
} from '../../src/lib/reference';
import {
  ArxivCitation,
  fetchArxivCitations,
} from '../../src/lib/semantic-scholar';

async function fetchAndStoreCitationsForAll() {
  console.log('='.repeat(60));
  console.log('开始批量获取论文被引用情况');
  console.log('='.repeat(60));

  const papers = await prisma.arxivPaper.findMany({
    where: { citationsStatus: 'pending' },
    orderBy: { createdAt: 'asc' },
  });

  if (papers.length === 0) {
    console.log('没有需要获取被引用情况的论文');
    return;
  }

  console.log(`找到 ${papers.length} 篇需要获取被引用情况的论文`);
  console.log('='.repeat(60));

  let totalAddedCount = 0;
  let totalExistingCount = 0;
  let totalLinkedCount = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const paper of papers) {
    console.log(`\n处理论文: ${paper.arxivId}`);
    console.log('-'.repeat(60));

    await prisma.arxivPaper.update({
      where: { id: paper.id },
      data: { citationsStatus: 'processing' },
    });

    const citations = await fetchArxivCitations(paper.arxivId);

    if (citations.length === 0) {
      console.log(`  没有找到被引用情况`);
      await prisma.arxivPaper.update({
        where: { id: paper.id },
        data: { citationsStatus: 'completed', citationsFetchedAt: new Date() },
      });
      skippedCount++;
      continue;
    }

    console.log(`  找到 ${citations.length} 篇被引用情况`);

    let addedCount = 0;
    let existingCount = 0;
    let linkedCount = 0;

    for (const cit of citations) {
      let citPaper = await prisma.arxivPaper.findUnique({
        where: { arxivId: cit.arxivId },
      });

      if (!citPaper) {
        citPaper = await prisma.arxivPaper.create({
          data: {
            arxivId: cit.arxivId,
            arxivUrl: cit.arxivUrl,
            title: cit.title,
            abstract: cit.abstract,
            publishedDate: cit.publishedDate,
            arxivDataStatus: 'pending',
          },
        });
        addedCount++;
      } else {
        existingCount++;
      }

      const relationCreated = await createCitationRelation(
        citPaper.id,
        paper.id,
      );
      if (relationCreated) {
        linkedCount++;
      }

      await saveCitationSemanticScholarData(citPaper.id, cit);
    }

    await prisma.arxivPaper.update({
      where: { id: paper.id },
      data: { citationsStatus: 'completed', citationsFetchedAt: new Date() },
    });

    console.log(`  新增论文: ${addedCount}`);
    console.log(`  已存在论文: ${existingCount}`);
    console.log(`  新增被引用关系: ${linkedCount}`);

    totalAddedCount += addedCount;
    totalExistingCount += existingCount;
    totalLinkedCount += linkedCount;
    processedCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('批量处理完成');
  console.log(`  处理论文: ${processedCount}`);
  console.log(`  跳过论文: ${skippedCount}`);
  console.log(`  新增论文: ${totalAddedCount}`);
  console.log(`  已存在论文: ${totalExistingCount}`);
  console.log(`  新增被引用关系: ${totalLinkedCount}`);
  console.log('='.repeat(60));
}

fetchAndStoreCitationsForAll()
  .catch((e: unknown) => {
    console.error('\n发生未捕获的错误:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
