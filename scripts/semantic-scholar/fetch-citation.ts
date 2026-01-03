import { fetchArxivCitations, ArxivCitation } from '../../src/lib/semantic-scholar';
import { prisma } from '../../src/lib/prisma';
import { saveCitationSemanticScholarData, createCitationRelation } from '../../src/lib/reference';

const args = process.argv.slice(2);
const targetArxivId = args[0];

async function fetchAndStoreCitations(arxivId: string) {
  console.log('='.repeat(60));
  console.log(`开始获取论文被引用情况: ${arxivId}`);
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

  if (paper.citationsStatus === 'completed') {
    console.log(`论文 ${arxivId} 的被引用情况已获取过，跳过`);
    return;
  }

  console.log(`\n正在获取被引用情况...`);
  await prisma.arxivPaper.update({
    where: { id: paper.id },
    data: { citationsStatus: 'processing' },
  });

  const citations = await fetchArxivCitations(arxivId);

  if (citations.length === 0) {
    console.log(`没有找到被引用情况`);
    await prisma.arxivPaper.update({
      where: { id: paper.id },
      data: { citationsStatus: 'completed', citationsFetchedAt: new Date() },
    });
    return;
  }

  console.log(`\n开始处理 ${citations.length} 篇被引用情况...`);
  console.log('='.repeat(60));

  let addedCount = 0;
  let existingCount = 0;
  let linkedCount = 0;

  for (const cit of citations) {
    console.log(`\n处理被引用情况: ${cit.arxivId}`);

    let citPaper = await prisma.arxivPaper.findUnique({
      where: { arxivId: cit.arxivId },
    });

    if (!citPaper) {
      console.log(`  创建新论文记录: ${cit.arxivId}`);
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
      console.log(`  论文 ${cit.arxivId} 已创建`);
    } else {
      console.log(`  论文 ${cit.arxivId} 已存在`);
      existingCount++;
    }

    const relationCreated = await createCitationRelation(citPaper.id, paper.id);
    if (relationCreated) {
      linkedCount++;
    }

    await saveCitationSemanticScholarData(citPaper.id, cit);
  }

  await prisma.arxivPaper.update({
    where: { id: paper.id },
    data: { citationsStatus: 'completed', citationsFetchedAt: new Date() },
  });

  console.log('\n' + '='.repeat(60));
  console.log('处理完成');
  console.log(`  新增论文: ${addedCount}`);
  console.log(`  已存在论文: ${existingCount}`);
  console.log(`  新增被引用关系: ${linkedCount}`);
  console.log('='.repeat(60));
}

if (!targetArxivId) {
  console.error('错误: 请提供 arXiv ID');
  console.error('用法: pnpm run fetch-citation <arxivId>');
  console.error('示例: pnpm run fetch-citation 2503.15888');
  process.exit(1);
}

fetchAndStoreCitations(targetArxivId)
  .catch((e: unknown) => {
    console.error('\n发生未捕获的错误:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
