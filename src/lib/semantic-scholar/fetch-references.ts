import { recordNetworkRequest } from '../network-request';

export interface ArxivReference {
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
  s2FieldsOfStudy?: Array<{ category?: string; field: string }>;
  venue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  authorDetails?: Array<{ authorId?: string; name: string }>;
}

export async function fetchArxivReferences(arxivId: string): Promise<ArxivReference[]> {
  console.log(`正在获取论文 ${arxivId} 的引用文献...`);

  const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=references.title,references.authors,references.externalIds,references.year,references.publicationDate,references.abstract,references.venue,references.citationCount,references.influentialCitationCount,references.s2FieldsOfStudy,references.openAccessPdf,references.publicationTypes,references.url,references.paperId`;
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
          'Accept': 'application/json',
          'User-Agent': 'Connected-Papers/1.0',
        },
      },
    );

    if (response.ok) {
      break;
    }

    if (response.status === 429 && retryCount < maxRetries) {
      console.log(`遇到 429 错误，等待 1 秒后重试 (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      retryCount++;
      continue;
    }

    console.error(`请求失败 URL: ${apiUrl}`);
    throw new Error(
      `Semantic Scholar API 请求失败: ${response.status} ${response.statusText}`,
    );
  } while (retryCount <= maxRetries);

  const data = await response.json();

  if (!data.references) {
    console.log(`论文 ${arxivId} 没有找到引用文献`);
    return [];
  }

  const references: ArxivReference[] = [];

  for (const ref of data.references) {
    const refArxivId = ref.externalIds?.ArXiv;
    if (refArxivId) {
      references.push({
        arxivId: refArxivId,
        arxivUrl: `https://arxiv.org/abs/${refArxivId}`,
        title: ref.title,
        authors: ref.authors?.map((a: any) => a.name).join(', '),
        publishedDate: ref.year ? `${ref.year}-01-01` : undefined,
        paperId: ref.paperId,
        url: ref.url,
        citationCount: ref.citationCount,
        influentialCitationCount: ref.influentialCitationCount,
        openAccessPdfUrl: ref.openAccessPdf?.url,
        publicationTypes: ref.publicationTypes?.join(', '),
        s2FieldsOfStudy: ref.s2FieldsOfStudy,
        venue: ref.venue,
        authorDetails: ref.authors?.map((a: any) => ({
          authorId: a.authorId,
          name: a.name
        })),
      });
    }
  }

  console.log(`找到 ${references.length} 篇 arXiv 引用文献`);

  return references;
}
