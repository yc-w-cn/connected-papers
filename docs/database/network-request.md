# NetworkRequest 数据表说明

## 概述

`NetworkRequest` 表用于记录所有外部 API 的网络请求信息，包括请求内容、响应结果、耗时等详细信息。该表用于监控和调试与 arXiv 和 Semantic Scholar API 的交互。

## 表结构

### 字段说明

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | String | 主键, UUID | 记录的唯一标识符 |
| `requestUrl` | String | 必填 | 请求的完整 URL |
| `requestMethod` | String | 默认 "GET" | HTTP 请求方法（GET、POST 等） |
| `requestBody` | String | 可选 | 请求体内容（JSON 字符串） |
| `requestHeaders` | String | 可选 | 请求头信息（JSON 字符串） |
| `responseStatus` | Int | 可选 | HTTP 响应状态码 |
| `responseBody` | String | 可选 | 响应体内容 |
| `responseHeaders` | String | 可选 | 响应头信息（JSON 字符串） |
| `duration` | Int | 可选 | 请求耗时（毫秒） |
| `success` | Boolean | 默认 false | 请求是否成功 |
| `errorMessage` | String | 可选 | 错误信息 |
| `source` | String | 必填 | 请求来源：'arxiv' 或 'semantic-scholar' |
| `arxivPaperId` | String | 可选 | 关联的 arXiv 论文 ID |
| `createdAt` | DateTime | 默认当前时间 | 记录创建时间 |

### 索引

| 索引名 | 字段 | 说明 |
|--------|------|------|
| `source_index` | `source` | 按请求来源查询 |
| `arxivPaperId_index` | `arxivPaperId` | 按论文 ID 查询 |
| `createdAt_index` | `createdAt` | 按创建时间查询 |

## 使用场景

### 1. 监控 API 调用

记录所有与外部 API 的交互，便于监控 API 使用情况和性能。

### 2. 调试问题

当 API 调用失败时，可以通过查看请求和响应的详细信息来定位问题。

### 3. 性能分析

通过 `duration` 字段分析 API 响应时间，优化系统性能。

### 4. 错误追踪

记录失败的请求及其错误信息，便于排查和修复问题。

## 数据示例

### 成功的 arXiv API 请求

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "requestUrl": "https://export.arxiv.org/api/query?id_list=2503.15888",
  "requestMethod": "GET",
  "responseStatus": 200,
  "responseBody": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "responseHeaders": "{\"content-type\":\"application/xml;charset=utf-8\"}",
  "duration": 1234,
  "success": true,
  "source": "arxiv",
  "arxivPaperId": "2503.15888",
  "createdAt": "2025-01-02T10:00:00.000Z"
}
```

### 失败的 Semantic Scholar API 请求

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "requestUrl": "https://api.semanticscholar.org/graph/v1/paper/arXiv:invalid-id?fields=...",
  "requestMethod": "GET",
  "responseStatus": 404,
  "duration": 567,
  "success": false,
  "errorMessage": "HTTP 404 Not Found",
  "source": "semantic-scholar",
  "arxivPaperId": "invalid-id",
  "createdAt": "2025-01-02T10:01:00.000Z"
}
```

## 关联关系

### 与 ArxivPaper 的关系

- `arxivPaperId` 字段可以关联到 `ArxivPaper.arxivId`
- 一个 `ArxivPaper` 可以有多条 `NetworkRequest` 记录
- 这种关系是可选的，因为某些请求可能不关联特定论文

## 使用方法

### 保存网络请求记录

```typescript
import { saveNetworkRequest } from '@/lib/network-request';

await saveNetworkRequest({
  requestUrl: 'https://api.example.com/data',
  requestMethod: 'GET',
  responseStatus: 200,
  duration: 500,
  success: true,
  source: 'arxiv',
  arxivPaperId: '2503.15888',
});
```

### 自动记录网络请求

```typescript
import { recordNetworkRequest } from '@/lib/network-request';

const response = await recordNetworkRequest(
  'arxiv',
  'https://export.arxiv.org/api/query?id_list=2503.15888',
  () => fetch('https://export.arxiv.org/api/query?id_list=2503.15888'),
  '2503.15888',
);
```

### 查询网络请求记录

```typescript
import { prisma } from '@/lib/prisma';

// 查询特定论文的所有请求
const requests = await prisma.networkRequest.findMany({
  where: { arxivPaperId: '2503.15888' },
  orderBy: { createdAt: 'desc' },
});

// 查询失败的请求
const failedRequests = await prisma.networkRequest.findMany({
  where: { success: false },
  orderBy: { createdAt: 'desc' },
});

// 查询特定来源的请求
const arxivRequests = await prisma.networkRequest.findMany({
  where: { source: 'arxiv' },
  orderBy: { createdAt: 'desc' },
});
```

## 性能考虑

### 数据清理

由于网络请求记录会不断增长，建议定期清理旧数据：

```typescript
// 删除 30 天前的记录
await prisma.networkRequest.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },
});
```

### 响应体大小

对于大型响应体，考虑截断或压缩存储以节省空间：

```typescript
const truncatedBody = responseBody.substring(0, 10000);
```

## 相关文档

- [业务逻辑说明](../BUSINESS_LOGIC.md) - 包含网络请求记录的业务流程
- [Arxiv 数据表说明](./arxiv.md) - Arxiv 相关数据表
- [Semantic Scholar 数据表说明](./semantic-scholar.md) - Semantic Scholar 相关数据表
- [引用关系表说明](./reference.md) - 引用关系表
