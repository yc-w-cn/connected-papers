import { XMLParser } from 'fast-xml-parser';

import { prisma } from '../src/lib/prisma';

const args = process.argv.slice(2);
const targetArxivId = args[0];

async function fetchArxivPaper(arxivId: string) {
  console.log(`  [1/3] 正在从 arXiv API 获取论文数据...`);
  console.log(
    `  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=${arxivId}`,
  );

  const response = await fetch(
    `https://export.arxiv.org/api/query?id_list=${arxivId}`,
  );

  if (!response.ok) {
    throw new Error(
      `arXiv API 请求失败: ${response.status} ${response.statusText}`,
    );
  }

  const text = await response.text();
  console.log(`  [1/3] 成功获取响应，响应长度: ${text.length} 字符`);

  console.log(`  [2/3] 正在解析 XML 数据...`);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const result = parser.parse(text);

  const feed = result.feed;
  if (!feed || !feed.entry) {
    throw new Error('未找到论文数据');
  }

  const entry = feed.entry;
  console.log(`  [2/3] XML 解析成功`);

  console.log(`  [3/3] 正在提取论文信息...`);
  const title = entry.title?.trim();
  const summary = entry.summary?.trim();
  const published = entry.published;

  const authors: string[] = [];
  if (entry.author) {
    const authorArray = Array.isArray(entry.author)
      ? entry.author
      : [entry.author];
    authorArray.forEach((author: any) => {
      if (author.name) {
        authors.push(author.name);
      }
    });
  }

  const resultData = {
    title,
    abstract: summary,
    authors: authors.join(', '),
    publishedDate: published?.split('T')[0],
  };

  console.log(`  [3/3] 提取完成:`);
  console.log(`      标题: ${title}`);
  console.log(`      作者: ${authors.join(', ')}`);
  console.log(`      发布日期: ${resultData.publishedDate}`);

  return resultData;
}

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
