import { fetchArxivReferences, ArxivReference } from '../src/lib/arxiv';
import { prisma } from '../src/lib/prisma';

const args = process.argv.slice(2);
const targetArxivId = args[0];

async function saveSemanticScholarData(arxivPaperId: string, ref: ArxivReference) {
  if (!ref.paperId) {
    console.log(`  跳过 Semantic Scholar 数据保存（无 paperId）`);
    return;
  }

  console.log(`  保存 Semantic Scholar 数据: ${ref.paperId}`);

  const existingSemanticPaper = await prisma.semanticScholarPaper.findUnique({
    where: { paperId: ref.paperId },
  });

  if (existingSemanticPaper) {
    console.log(`  Semantic Scholar 数据已存在，跳过`);
    return;
  }

  const semanticPaper = await prisma.semanticScholarPaper.create({
    data: {
      paperId: ref.paperId,
      url: ref.url,
      citationCount: ref.citationCount,
      influentialCitationCount: ref.influentialCitationCount,
      openAccessPdfUrl: ref.openAccessPdfUrl,
      publicationTypes: ref.publicationTypes,
      arxivPaperId: arxivPaperId,
    },
  });

  console.log(`  Semantic Scholar 论文已创建`);

  if (ref.authorDetails && ref.authorDetails.length > 0) {
    for (const author of ref.authorDetails) {
      await prisma.semanticScholarAuthor.create({
        data: {
          authorId: author.authorId,
          name: author.name,
          arxivPaperId: arxivPaperId,
        },
      });
    }
    console.log(`  已保存 ${ref.authorDetails.length} 位作者`);
  }

  if (ref.s2FieldsOfStudy && ref.s2FieldsOfStudy.length > 0) {
    for (const field of ref.s2FieldsOfStudy) {
      await prisma.semanticScholarFieldOfStudy.create({
        data: {
          field: field.field,
          category: field.category,
          arxivPaperId: arxivPaperId,
        },
      });
    }
    console.log(`  已保存 ${ref.s2FieldsOfStudy.length} 个研究领域`);
  }

  if (ref.venue || ref.volume || ref.issue || ref.pages) {
    await prisma.semanticScholarVenue.create({
      data: {
        venue: ref.venue,
        volume: ref.volume,
        issue: ref.issue,
        pages: ref.pages,
        arxivPaperId: arxivPaperId,
      },
    });
    console.log(`  已保存发表场所信息`);
  }
}

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
        status: 'pending',
      },
    });
    console.log(`论文 ${arxivId} 已创建`);
  }

  console.log(`\n正在获取引用文献...`);
  const references = await fetchArxivReferences(arxivId);

  if (references.length === 0) {
    console.log(`没有找到引用文献`);
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
          status: 'pending',
        },
      });
      addedCount++;
      console.log(`  论文 ${ref.arxivId} 已创建`);
    } else {
      console.log(`  论文 ${ref.arxivId} 已存在`);
      existingCount++;
    }

    const existingReference = await prisma.reference.findUnique({
      where: {
        paperId_referenceId: {
          paperId: paper.id,
          referenceId: refPaper.id,
        },
      },
    });

    if (!existingReference) {
      await prisma.reference.create({
        data: {
          paperId: paper.id,
          referenceId: refPaper.id,
        },
      });
      linkedCount++;
      console.log(`  引用关系已创建`);
    } else {
      console.log(`  引用关系已存在`);
    }

    await saveSemanticScholarData(refPaper.id, ref);
  }

  console.log('\n' + '='.repeat(60));
  console.log('处理完成');
  console.log(`  新增论文: ${addedCount}`);
  console.log(`  已存在论文: ${existingCount}`);
  console.log(`  新增引用关系: ${linkedCount}`);
  console.log('='.repeat(60));
}

if (!targetArxivId) {
  console.error('错误: 请提供 arXiv ID');
  console.error('用法: pnpm run fetch-references <arxivId>');
  console.error('示例: pnpm run fetch-references 2503.15888');
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
