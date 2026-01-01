export interface ArxivReference {
  arxivId: string;
  arxivUrl: string;
  title?: string;
  authors?: string;
  abstract?: string;
  publishedDate?: string;
}

export async function fetchArxivReferences(arxivId: string): Promise<ArxivReference[]> {
  console.log(`正在获取论文 ${arxivId} 的引用文献...`);

  const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=references.title,references.authors,references.externalIds,references.year,references.publicationDate`;
  console.log(`请求 URL: ${apiUrl}`);

  const response = await fetch(apiUrl);

  if (!response.ok) {
    console.error(`请求失败 URL: ${apiUrl}`);
    throw new Error(
      `Semantic Scholar API 请求失败: ${response.status} ${response.statusText}`,
    );
  }

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
      });
    }
  }

  console.log(`找到 ${references.length} 篇 arXiv 引用文献`);

  return references;
}
