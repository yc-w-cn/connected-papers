import fs from 'fs';
import path from 'path';

import { prisma } from '@/lib/prisma';
import type {
  AuthorData,
  DataManifest,
  Link,
  Node,
  PaperData,
  VenueData,
} from '@/types/data';

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function writeChunkFile(
  filename: string,
  data: unknown,
  outputDir: string,
): { filename: string; size: number; count: number } {
  const filePath = path.join(outputDir, filename);
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonString, 'utf-8');
  const size = Buffer.byteLength(jsonString, 'utf-8');
  const count = Array.isArray(data) ? data.length : 1;
  return { filename, size, count };
}

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
      arxivId: paper.arxivId ?? undefined,
      title: paper.title ?? undefined,
      abstract: paper.abstract ?? undefined,
      publishedDate: paper.publishedDate ?? undefined,
      citationCount: paper.semanticScholarPaper?.citationCount ?? undefined,
      journalRef: paper.journalRef ?? undefined,
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
          venue: venue.venue ?? undefined,
          volume: venue.volume ?? undefined,
          issue: venue.issue ?? undefined,
          pages: venue.pages ?? undefined,
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
          affiliation: author.affiliation ?? undefined,
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

  const statistics = {
    authorCount: authorMap.size,
    paperCount: paperMap.size,
    venueCount: venueMap.size,
  };

  const outputDir = path.join(process.cwd(), 'public', 'data-chunks');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const statisticsChunk = writeChunkFile(
    'statistics.json',
    statistics,
    outputDir,
  );

  const nodeChunks = chunkArray(nodes, 5000);
  const networkNodesChunks = nodeChunks.map((chunk, index) =>
    writeChunkFile(`network-nodes-${index}.json`, chunk, outputDir),
  );

  const linkChunks = chunkArray(links, 10000);
  const networkLinksChunks = linkChunks.map((chunk, index) =>
    writeChunkFile(`network-links-${index}.json`, chunk, outputDir),
  );

  const authors = Array.from(authorMap.values());
  const authorChunks = chunkArray(authors, 2000);
  const authorsChunks = authorChunks.map((chunk, index) =>
    writeChunkFile(`authors-${index}.json`, chunk, outputDir),
  );

  const papersArray = Array.from(paperMap.values());
  const paperChunks = chunkArray(papersArray, 500);
  const papersChunks = paperChunks.map((chunk, index) =>
    writeChunkFile(`papers-${index}.json`, chunk, outputDir),
  );

  const venues = Array.from(venueMap.values());
  const venueChunks = chunkArray(venues, 500);
  const venuesChunks = venueChunks.map((chunk, index) =>
    writeChunkFile(`venues-${index}.json`, chunk, outputDir),
  );

  const totalSize =
    statisticsChunk.size +
    networkNodesChunks.reduce((sum, c) => sum + c.size, 0) +
    networkLinksChunks.reduce((sum, c) => sum + c.size, 0) +
    authorsChunks.reduce((sum, c) => sum + c.size, 0) +
    papersChunks.reduce((sum, c) => sum + c.size, 0) +
    venuesChunks.reduce((sum, c) => sum + c.size, 0);

  const manifest: DataManifest = {
    version: '1.0.0',
    statistics,
    chunks: {
      statistics: statisticsChunk,
      networkNodes: networkNodesChunks,
      networkLinks: networkLinksChunks,
      authors: authorsChunks,
      papers: papersChunks,
      venues: venuesChunks,
    },
    totalSize,
  };

  const manifestPath = path.join(process.cwd(), 'public', 'data-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`数据已导出到: ${outputDir}`);
  console.log(`Manifest 已导出到: ${manifestPath}`);
  console.log(`作者数量: ${statistics.authorCount}`);
  console.log(`论文数量: ${statistics.paperCount}`);
  console.log(`期刊数量: ${statistics.venueCount}`);
  console.log(`节点数量: ${nodes.length}`);
  console.log(`连接数量: ${links.length}`);
  console.log(
    `总分片数量: ${1 + networkNodesChunks.length + networkLinksChunks.length + authorsChunks.length + papersChunks.length + venuesChunks.length}`,
  );
  console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

exportData()
  .catch((e: unknown) => {
    console.error('导出数据时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
