import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import type { ExportedData, Node, Link, AuthorData, PaperData, VenueData } from '@/types/data';

async function exportData() {
  const papers = await prisma.arxivPaper.findMany({
    include: {
      authors: true,
      references: true,
      citedBy: true,
      semanticScholarPaper: {
        include: {
          venue: true,
        },
      },
    },
  });

  const authorMap = new Map<string, AuthorData>();
  const paperMap = new Map<string, PaperData>();
  const venueMap = new Map<string, VenueData>();

  const nodes: Node[] = [];
  const links: Link[] = [];

  papers.forEach((paper) => {
    paperMap.set(paper.id, {
      id: paper.id,
      arxivId: paper.arxivId,
      title: paper.title,
      abstract: paper.abstract,
      publishedDate: paper.publishedDate,
      citationCount: paper.semanticScholarPaper?.citationCount,
      journalRef: paper.journalRef,
    });

    nodes.push({
      id: paper.id,
      type: 'paper',
      label: paper.title || paper.arxivId,
      citationCount: paper.semanticScholarPaper?.citationCount || 0,
    });

    if (paper.semanticScholarPaper?.venue) {
      const venue = paper.semanticScholarPaper.venue;
      if (!venueMap.has(venue.id)) {
        venueMap.set(venue.id, {
          id: venue.id,
          venue: venue.venue,
          volume: venue.volume,
          issue: venue.issue,
          pages: venue.pages,
        });

        nodes.push({
          id: venue.id,
          type: 'venue',
          label: venue.venue || 'Unknown Venue',
        });
      }

      links.push({
        source: paper.id,
        target: venue.id,
        type: 'appeared_in',
      });
    }

    paper.authors.forEach((author) => {
      if (!authorMap.has(author.id)) {
        authorMap.set(author.id, {
          id: author.id,
          name: author.name,
          affiliation: author.affiliation,
        });

        nodes.push({
          id: author.id,
          type: 'author',
          label: author.name,
        });
      }

      links.push({
        source: author.id,
        target: paper.id,
        type: 'published',
      });
    });

    paper.references.forEach((ref) => {
      links.push({
        source: paper.id,
        target: ref.referenceId,
        type: 'cited',
      });
    });

    paper.citedBy.forEach((ref) => {
      links.push({
        source: ref.paperId,
        target: paper.id,
        type: 'cited',
      });
    });
  });

  const exportedData: ExportedData = {
    statistics: {
      authorCount: authorMap.size,
      paperCount: paperMap.size,
      venueCount: venueMap.size,
    },
    network: {
      nodes,
      links,
    },
    authors: Array.from(authorMap.values()),
    papers: Array.from(paperMap.values()),
    venues: Array.from(venueMap.values()),
  };

  const outputPath = path.join(process.cwd(), 'public', 'data.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportedData, null, 2), 'utf-8');

  console.log(`数据已导出到: ${outputPath}`);
  console.log(`作者数量: ${exportedData.statistics.authorCount}`);
  console.log(`论文数量: ${exportedData.statistics.paperCount}`);
  console.log(`期刊数量: ${exportedData.statistics.venueCount}`);
  console.log(`节点数量: ${exportedData.network.nodes.length}`);
  console.log(`连接数量: ${exportedData.network.links.length}`);
}

exportData()
  .catch((e: unknown) => {
    console.error('导出数据时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
