# API 集成

## 概述

本文档详细说明了系统与外部 API 的集成方式，包括 arXiv API 和 Semantic Scholar API 的使用方法。

## arXiv API

### 端点

```
https://export.arxiv.org/api/query?id_list={arxivId}
```

### 请求示例

```bash
GET https://export.arxiv.org/api/query?id_list=2503.15888
```

### 响应格式

XML

### 响应示例

```xml
<entry>
  <title>论文标题</title>
  <summary>论文摘要</summary>
  <published>2025-03-25T00:00:00Z</published>
  <updated>2025-03-26T00:00:00Z</updated>
  <arxiv:primary_category term="cs.AI"/>
  <category term="cs.AI"/>
  <category term="cs.LG"/>
  <license>http://creativecommons.org/licenses/by/4.0/</license>
  <arxiv:journal_ref>J. Machine Learning Research, 2025</arxiv:journal_ref>
  <arxiv:doi>10.1234/example.doi</arxiv:doi>
  <comment>附加评论信息</comment>
  <author>
    <name>作者1</name>
    <arxiv:affiliation>机构1</arxiv:affiliation>
  </author>
  <author>
    <name>作者2</name>
    <arxiv:affiliation>机构2</arxiv:affiliation>
  </author>
</entry>
```

### 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `title` | 论文标题 | "论文标题" |
| `summary` | 论文摘要 | "论文摘要内容" |
| `published` | 发布日期 | "2025-03-25T00:00:00Z" |
| `updated` | arXiv 更新时间 | "2025-03-26T00:00:00Z" |
| `arxiv:primary_category` | 主分类 | "cs.AI" |
| `category` | 所有分类 | "cs.AI", "cs.LG" |
| `license` | 许可证 | "http://creativecommons.org/licenses/by/4.0/" |
| `arxiv:journal_ref` | 期刊引用 | "J. Machine Learning Research, 2025" |
| `arxiv:doi` | DOI | "10.1234/example.doi" |
| `comment` | 评论 | "附加评论信息" |
| `author` | 作者列表 | 包含姓名和机构 |

### 使用示例

```typescript
const arxivId = '2503.15888';
const apiUrl = `https://export.arxiv.org/api/query?id_list=${arxivId}`;

const response = await fetch(apiUrl);
const xmlText = await response.text();

// 使用 XML 解析器解析响应
const parser = new XMLParser();
const result = parser.parse(xmlText);
```

### 相关文件

- [src/lib/arxiv/fetch-paper.ts](../../src/lib/arxiv/fetch-paper.ts) - arXiv API 调用逻辑
- [处理单个论文](../../scripts/arxiv/process-paper.md) - process-paper 脚本使用说明
- [批量处理论文](../../scripts/arxiv/process-papers.md) - process-papers 脚本使用说明

## Semantic Scholar API

### 端点

```
https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxivId}?fields={fields}
```

### 请求示例

```bash
GET https://api.semanticscholar.org/graph/v1/paper/arXiv:2503.15888?fields=references.title,references.authors,references.authorId,references.externalIds,references.year,references.publicationDate,references.abstract,references.venue,references.volume,references.issue,references.pages,references.citationCount,references.influentialCitationCount,references.s2FieldsOfStudy,references.openAccessPdf,references.publicationTypes,references.url,references.paperId
```

### 响应格式

JSON

### 响应示例

```json
{
  "references": [
    {
      "paperId": "abc123",
      "arxivId": "2401.12345",
      "title": "引用论文标题",
      "authors": [
        {"authorId": "author1", "name": "作者1"},
        {"authorId": "author2", "name": "作者2"}
      ],
      "year": 2024,
      "publicationDate": "2024-01-15",
      "abstract": "论文摘要",
      "venue": "会议/期刊名称",
      "volume": "10",
      "issue": "1",
      "pages": "1-15",
      "citationCount": 100,
      "influentialCitationCount": 50,
      "s2FieldsOfStudy": [
        {"field": "Computer Science", "category": "Artificial Intelligence"}
      ],
      "openAccessPdf": {
        "url": "https://example.com/paper.pdf"
      },
      "publicationTypes": ["JournalArticle"],
      "url": "https://semanticscholar.org/paper/abc123"
    }
  ]
}
```

### 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `paperId` | Semantic Scholar 论文 ID | "abc123" |
| `arxivId` | arXiv 论文 ID（通过 externalIds.ArXiv 获取） | "2401.12345" |
| `title` | 引用论文标题 | "引用论文标题" |
| `authors.authorId` | Semantic Scholar 作者 ID | "author1" |
| `authors.name` | 引用论文作者列表 | "作者1", "作者2" |
| `year` | 引用论文年份 | 2024 |
| `publicationDate` | 引用论文发布日期 | "2024-01-15" |
| `abstract` | 论文摘要 | "论文摘要" |
| `venue` | 发表场所（会议或期刊名称） | "会议/期刊名称" |
| `volume` | 卷号 | "10" |
| `issue` | 期号 | "1" |
| `pages` | 页码 | "1-15" |
| `citationCount` | 引用次数 | 100 |
| `influentialCitationCount` | 影响力引用次数 | 50 |
| `s2FieldsOfStudy` | 研究领域列表 | [{"field": "Computer Science", "category": "Artificial Intelligence"}] |
| `openAccessPdf.url` | 开放访问 PDF 链接 | "https://example.com/paper.pdf" |
| `publicationTypes` | 发表类型数组 | ["JournalArticle"] |
| `url` | Semantic Scholar 论文链接 | "https://semanticscholar.org/paper/abc123" |

### 使用示例

```typescript
const arxivId = '2503.15888';
const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=references.title,references.authors,references.authorId,references.externalIds,references.year,references.publicationDate,references.abstract,references.venue,references.volume,references.issue,references.pages,references.citationCount,references.influentialCitationCount,references.s2FieldsOfStudy,references.openAccessPdf,references.publicationTypes,references.url,references.paperId`;

const response = await fetch(apiUrl);
const data = await response.json();

// 处理引用文献
for (const ref of data.references) {
  // 处理每篇引用文献
}
```

### 相关文件

- [src/lib/semantic-scholar/fetch-references.ts](../../src/lib/semantic-scholar/fetch-references.ts) - Semantic Scholar API 调用逻辑
- [获取引用文献](../../scripts/semantic-scholar/fetch-references.md) - fetch-references 脚本使用说明

## API 使用规范

### arXiv API

1. **请求频率**: 遵守 arXiv API 使用规范，避免过于频繁的请求
2. **请求间隔**: 建议每次请求间隔至少 1 秒
3. **批量查询**: 支持一次查询多篇论文（使用逗号分隔 arXiv ID）

### Semantic Scholar API

1. **请求频率**: Semantic Scholar API 有请求频率限制
2. **错误处理**: 如果遇到限流错误（429），请等待一段时间后重试
3. **字段选择**: 只请求需要的字段，减少数据传输量

## 相关文档

- [Arxiv 数据表说明](./arxiv.md) - Arxiv 相关数据表详细说明
- [Semantic Scholar 数据表说明](./semantic-scholar.md) - Semantic Scholar 相关数据表详细说明
- [网络请求表说明](./network-request.md) - NetworkRequest 表详细说明
- [错误处理](../architecture/error-handling.md) - 错误处理机制
