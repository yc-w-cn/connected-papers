import { prisma } from '../prisma';
import { ArxivReference } from '../semantic-scholar';

export async function saveSemanticScholarData(arxivPaperId: string, ref: ArxivReference) {
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

export async function createReferenceRelation(paperId: string, referenceId: string) {
  const existingReference = await prisma.reference.findUnique({
    where: {
      paperId_referenceId: {
        paperId,
        referenceId,
      },
    },
  });

  if (!existingReference) {
    await prisma.reference.create({
      data: {
        paperId,
        referenceId,
      },
    });
    console.log(`  引用关系已创建`);
    return true;
  } else {
    console.log(`  引用关系已存在`);
    return false;
  }
}
