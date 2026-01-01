import { XMLParser } from 'fast-xml-parser';

export interface ArxivPaperData {
  title: string;
  abstract: string;
  authors: string;
  publishedDate: string;
}

export async function fetchArxivPaper(
  arxivId: string,
): Promise<ArxivPaperData> {
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

  const resultData: ArxivPaperData = {
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
