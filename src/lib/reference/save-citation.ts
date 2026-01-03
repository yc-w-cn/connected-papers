import { prisma } from '../prisma';
import { ArxivCitation } from '../semantic-scholar';

export async function saveCitationSemanticScholarData(
  arxivPaperId: string,
  cit: ArxivCitation,
) {
  if (!cit.paperId) {
    console.log(`  跳过 Semantic Scholar 数据保存（无 paperId）`);
    return;
  }

  console.log(`  保存 Semantic Scholar 数据: ${cit.paperId}`);

  const existingSemanticPaper = await prisma.semanticScholarPaper.findUnique({
    where: { paperId: cit.paperId },
  });

  if (existingSemanticPaper) {
    console.log(`  Semantic Scholar 数据已存在，跳过`);
    return;
  }

  const semanticPaper = await prisma.semanticScholarPaper.create({
    data: {
      paperId: cit.paperId,
      url: cit.url,
      citationCount: cit.citationCount,
      influentialCitationCount: cit.influentialCitationCount,
      openAccessPdfUrl: cit.openAccessPdfUrl,
      publicationTypes: cit.publicationTypes,
      arxivPaperId: arxivPaperId,
    },
  });

  console.log(`  Semantic Scholar 论文已创建`);

  if (cit.authorDetails && cit.authorDetails.length > 0) {
    for (const author of cit.authorDetails) {
      await prisma.semanticScholarAuthor.create({
        data: {
          authorId: author.authorId,
          name: author.name,
          arxivPaperId: semanticPaper.id,
        },
      });
    }
    console.log(`  已保存 ${cit.authorDetails.length} 位作者`);
  }

  if (cit.s2FieldsOfStudy && cit.s2FieldsOfStudy.length > 0) {
    for (const field of cit.s2FieldsOfStudy) {
      if (field.field) {
        await prisma.semanticScholarFieldOfStudy.create({
          data: {
            field: field.field,
            category: field.category,
            arxivPaperId: semanticPaper.id,
          },
        });
      }
    }
    console.log(`  已保存 ${cit.s2FieldsOfStudy.length} 个研究领域`);
  }

  if (cit.venue) {
    await prisma.semanticScholarVenue.create({
      data: {
        venue: cit.venue,
        volume: cit.volume,
        issue: cit.issue,
        pages: cit.pages,
        arxivPaperId: semanticPaper.id,
      },
    });
    console.log(`  已保存发表场所信息`);
  }
}

export async function createCitationRelation(
  citingPaperId: string,
  citedPaperId: string,
) {
  const existingCitation = await prisma.reference.findUnique({
    where: {
      paperId_referenceId: {
        paperId: citingPaperId,
        referenceId: citedPaperId,
      },
    },
  });

  if (!existingCitation) {
    await prisma.reference.create({
      data: {
        paperId: citingPaperId,
        referenceId: citedPaperId,
      },
    });
    console.log(`  被引用关系已创建`);
    return true;
  } else {
    console.log(`  被引用关系已存在`);
    return false;
  }
}
