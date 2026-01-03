import { recordNetworkRequest } from '../network-request';

export interface ArxivCitation {
  arxivId: string;
  arxivUrl: string;
  title?: string;
  authors?: string;
  abstract?: string;
  publishedDate?: string;
  paperId?: string;
  url?: string;
  citationCount?: number;
  influentialCitationCount?: number;
  openAccessPdfUrl?: string;
  publicationTypes?: string;
  s2FieldsOfStudy?: { category?: string; field: string }[];
  venue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  authorDetails?: { authorId?: string; name: string }[];
}

export async function fetchArxivCitations(
  arxivId: string,
): Promise<ArxivCitation[]> {
  console.log(`正在获取论文 ${arxivId} 的被引用情况...`);

  const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=citations.title,citations.authors,citations.externalIds,citations.year,citations.publicationDate,citations.abstract,citations.venue,citations.citationCount,citations.influentialCitationCount,citations.s2FieldsOfStudy,citations.openAccessPdf,citations.publicationTypes,citations.url,citations.paperId`;
  console.log(`请求 URL: ${apiUrl}`);

  const maxRetries = 3;
  let retryCount = 0;
  let response: Response;

  do {
    response = await recordNetworkRequest(
      'semantic-scholar',
      apiUrl,
      () => fetch(apiUrl),
      arxivId,
      {
        requestMethod: 'GET',
        requestHeaders: {
          Accept: 'application/json',
          'User-Agent': 'Connected-Papers/1.0',
        },
      },
    );

    if (response.ok) {
      break;
    }

    if (response.status === 429 && retryCount < maxRetries) {
      console.log(
        `遇到 429 错误，等待 1 秒后重试 (${retryCount + 1}/${maxRetries})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retryCount++;
      continue;
    }

    console.error(`请求失败 URL: ${apiUrl}`);
    throw new Error(
      `Semantic Scholar API 请求失败: ${response.status} ${response.statusText}`,
    );
  } while (retryCount <= maxRetries);

  const data = await response.json();

  if (!data.citations) {
    console.log(`论文 ${arxivId} 没有找到被引用情况`);
    return [];
  }

  const citations: ArxivCitation[] = [];

  for (const cit of data.citations) {
    const citArxivId = cit.externalIds?.ArXiv;
    if (citArxivId) {
      citations.push({
        arxivId: citArxivId,
        arxivUrl: `https://arxiv.org/abs/${citArxivId}`,
        title: cit.title,
        authors: cit.authors?.map((a: any) => a.name).join(', '),
        publishedDate: cit.year ? `${cit.year}-01-01` : undefined,
        paperId: cit.paperId,
        url: cit.url,
        citationCount: cit.citationCount,
        influentialCitationCount: cit.influentialCitationCount,
        openAccessPdfUrl: cit.openAccessPdf?.url,
        publicationTypes: cit.publicationTypes?.join(', '),
        s2FieldsOfStudy: cit.s2FieldsOfStudy,
        venue: cit.venue,
        authorDetails: cit.authors?.map((a: any) => ({
          authorId: a.authorId,
          name: a.name,
        })),
      });
    }
  }

  console.log(`找到 ${citations.length} 篇 arXiv 被引用情况`);

  return citations;
}
