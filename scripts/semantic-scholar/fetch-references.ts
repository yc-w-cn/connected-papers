import { fetchArxivReferences, ArxivReference } from '../../src/lib/semantic-scholar';
import { prisma } from '../../src/lib/prisma';
import { saveSemanticScholarData, createReferenceRelation } from '../../src/lib/reference';

async function fetchAndStoreReferencesForAll() {
  console.log('='.repeat(60));
  console.log('开始批量获取论文引用文献');
  console.log('='.repeat(60));

  const papers = await prisma.arxivPaper.findMany({
    where: { referencesFetched: false },
    orderBy: { createdAt: 'asc' },
  });

  if (papers.length === 0) {
    console.log('没有需要获取引用文献的论文');
    return;
  }

  console.log(`找到 ${papers.length} 篇需要获取引用文献的论文`);
  console.log('='.repeat(60));

  let totalAddedCount = 0;
  let totalExistingCount = 0;
  let totalLinkedCount = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const paper of papers) {
    console.log(`\n处理论文: ${paper.arxivId}`);
    console.log('-'.repeat(60));

    const references = await fetchArxivReferences(paper.arxivId);

    if (references.length === 0) {
      console.log(`  没有找到引用文献`);
      await prisma.arxivPaper.update({
        where: { id: paper.id },
        data: { referencesFetched: true },
      });
      skippedCount++;
      continue;
    }

    console.log(`  找到 ${references.length} 篇引用文献`);

    let addedCount = 0;
    let existingCount = 0;
    let linkedCount = 0;

    for (const ref of references) {
      let refPaper = await prisma.arxivPaper.findUnique({
        where: { arxivId: ref.arxivId },
      });

      if (!refPaper) {
        refPaper = await prisma.arxivPaper.create({
          data: {
            arxivId: ref.arxivId,
            arxivUrl: ref.arxivUrl,
            title: ref.title,
            abstract: ref.abstract,
            publishedDate: ref.publishedDate,
            status: 'pending',
          },
        });
        addedCount++;
      } else {
        existingCount++;
      }

      const relationCreated = await createReferenceRelation(paper.id, refPaper.id);
      if (relationCreated) {
        linkedCount++;
      }

      await saveSemanticScholarData(refPaper.id, ref);
    }

    await prisma.arxivPaper.update({
      where: { id: paper.id },
      data: { referencesFetched: true },
    });

    console.log(`  新增论文: ${addedCount}`);
    console.log(`  已存在论文: ${existingCount}`);
    console.log(`  新增引用关系: ${linkedCount}`);

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
  console.log(`  新增引用关系: ${totalLinkedCount}`);
  console.log('='.repeat(60));
}

fetchAndStoreReferencesForAll()
  .catch((e: unknown) => {
    console.error('\n发生未捕获的错误:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
