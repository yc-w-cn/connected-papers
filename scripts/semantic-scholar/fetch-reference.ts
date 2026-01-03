import { fetchArxivReferences } from '../../src/lib/semantic-scholar';
import { prisma } from '../../src/lib/prisma';
import { saveSemanticScholarData, createReferenceRelation } from '../../src/lib/reference';

const args = process.argv.slice(2);
const targetArxivId = args[0];

async function fetchAndStoreReferences(arxivId: string) {
  console.log('='.repeat(60));
  console.log(`开始获取论文引用文献: ${arxivId}`);
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

  if (paper.referencesStatus === 'completed') {
    console.log(`论文 ${arxivId} 的引用文献已获取过，跳过`);
    return;
  }

  console.log(`\n正在获取引用文献...`);
  await prisma.arxivPaper.update({
    where: { id: paper.id },
    data: { referencesStatus: 'processing' },
  });

  const references = await fetchArxivReferences(arxivId);

  if (references.length === 0) {
    console.log(`没有找到引用文献`);
    await prisma.arxivPaper.update({
      where: { id: paper.id },
      data: { referencesStatus: 'completed', referencesFetchedAt: new Date() },
    });
    return;
  }

  console.log(`\n开始处理 ${references.length} 篇引用文献...`);
  console.log('='.repeat(60));

  let addedCount = 0;
  let existingCount = 0;
  let linkedCount = 0;

  for (const ref of references) {
    console.log(`\n处理引用文献: ${ref.arxivId}`);

    let refPaper = await prisma.arxivPaper.findUnique({
      where: { arxivId: ref.arxivId },
    });

    if (!refPaper) {
      console.log(`  创建新论文记录: ${ref.arxivId}`);
      refPaper = await prisma.arxivPaper.create({
        data: {
          arxivId: ref.arxivId,
          arxivUrl: ref.arxivUrl,
          title: ref.title,
          abstract: ref.abstract,
          publishedDate: ref.publishedDate,
          arxivDataStatus: 'pending',
        },
      });
      addedCount++;
      console.log(`  论文 ${ref.arxivId} 已创建`);
    } else {
      console.log(`  论文 ${ref.arxivId} 已存在`);
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
    data: { referencesStatus: 'completed', referencesFetchedAt: new Date() },
  });

  console.log('\n' + '='.repeat(60));
  console.log('处理完成');
  console.log(`  新增论文: ${addedCount}`);
  console.log(`  已存在论文: ${existingCount}`);
  console.log(`  新增引用关系: ${linkedCount}`);
  console.log('='.repeat(60));
}

if (!targetArxivId) {
  console.error('错误: 请提供 arXiv ID');
  console.error('用法: pnpm run fetch-reference <arxivId>');
  console.error('示例: pnpm run fetch-reference 2503.15888');
  process.exit(1);
}

fetchAndStoreReferences(targetArxivId)
  .catch((e: unknown) => {
    console.error('\n发生未捕获的错误:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
