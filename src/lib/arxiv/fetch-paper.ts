import { XMLParser } from 'fast-xml-parser';
import { recordNetworkRequest } from '../network-request';

export interface ArxivAuthor {
  name: string;
  affiliation?: string;
}

export interface ArxivPaperData {
  title: string;
  abstract: string;
  authors: ArxivAuthor[];
  publishedDate: string;
  primaryCategory?: string;
  categories: string[];
  license?: string;
  updatedAtArxiv?: string;
  comment?: string;
  journalRef?: string;
  doi?: string;
}

export async function fetchArxivPaper(
  arxivId: string,
): Promise<ArxivPaperData> {
  console.log(`  [1/3] 正在从 arXiv API 获取论文数据...`);
  const apiUrl = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
  console.log(
    `  [1/3] 请求 URL: ${apiUrl}`,
  );

  const response = await recordNetworkRequest(
    'arxiv',
    apiUrl,
    () => fetch(apiUrl),
    arxivId,
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
  const updated = entry.updated;
  const license = entry.license;
  const comment = entry.comment;
  const journalRef = entry['arxiv:journal_ref'];
  const doi = entry['arxiv:doi'];

  const primaryCategory = entry['arxiv:primary_category']?.['@_term'];
  
  const categories: string[] = [];
  if (entry.category) {
    const categoryArray = Array.isArray(entry.category)
      ? entry.category
      : [entry.category];
    categoryArray.forEach((cat: any) => {
      if (cat['@_term']) {
        categories.push(cat['@_term']);
      }
    });
  }

  const authors: ArxivAuthor[] = [];
  if (entry.author) {
    const authorArray = Array.isArray(entry.author)
      ? entry.author
      : [entry.author];
    authorArray.forEach((author: any) => {
      if (author.name) {
        authors.push({
          name: author.name,
          affiliation: author['arxiv:affiliation'] || undefined,
        });
      }
    });
  }

  const resultData: ArxivPaperData = {
    title,
    abstract: summary,
    authors,
    publishedDate: published?.split('T')[0],
    primaryCategory,
    categories,
    license,
    updatedAtArxiv: updated?.split('T')[0],
    comment,
    journalRef,
    doi,
  };

  console.log(`  [3/3] 提取完成:`);
  console.log(`      标题: ${title}`);
  console.log(`      作者: ${authors.map(a => a.name).join(', ')}`);
  console.log(`      发布日期: ${resultData.publishedDate}`);
  console.log(`      主分类: ${primaryCategory || '无'}`);
  console.log(`      所有分类: ${categories.join(', ') || '无'}`);
  console.log(`      许可证: ${license || '无'}`);
  console.log(`      DOI: ${doi || '无'}`);

  return resultData;
}
