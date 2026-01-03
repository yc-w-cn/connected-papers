# 状态机设计

## 概述

论文处理系统使用状态机来管理论文的处理流程，确保每篇论文的处理状态清晰可追踪。

## 状态转换图

```
arxivDataStatus: pending -> processing -> completed
                    |
                    v
                  failed

referencesStatus: pending -> processing -> completed
                    |
                    v
                  failed

citationsStatus: pending -> processing -> completed
                    |
                    v
                  failed
```

## 引用文献获取状态

除了处理状态外，系统还维护引用文献和被引用情况的获取状态：

```
referencesStatus: pending -> processing -> completed
referencesFetchedAt: DateTime

citationsStatus: pending -> processing -> completed
citationsFetchedAt: DateTime
```

- `pending`: 尚未获取
- `processing`: 正在获取中
- `completed`: 已成功获取
- `failed`: 获取失败
- `referencesFetchedAt`: 成功获取引用文献的时间戳
- `citationsFetchedAt`: 成功获取被引用情况的时间戳

## 状态说明

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 论文已添加，等待处理 | `processing` |
| `processing` | 正在从 arXiv API 获取数据 | `completed`, `failed` |
| `completed` | 数据获取成功，处理完成 | - |
| `failed` | 处理过程中出现错误 | - |

### arXiv 数据获取状态

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 等待获取 arXiv 详细信息 | `processing` |
| `processing` | 正在从 arXiv API 获取详细信息 | `completed`, `failed` |
| `completed` | arXiv 详细信息获取成功 | - |
| `failed` | arXiv 详细信息获取失败 | - |

### 引用文献获取状态

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 等待获取引用文献 | `processing` |
| `processing` | 正在从 Semantic Scholar API 获取引用文献 | `completed`, `failed` |
| `completed` | 引用文献获取成功 | - |
| `failed` | 引用文献获取失败 | - |

### 被引用情况获取状态

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 等待获取被引用情况 | `processing` |
| `processing` | 正在从 Semantic Scholar API 获取被引用情况 | `completed`, `failed` |
| `completed` | 被引用情况获取成功 | - |
| `failed` | 被引用情况获取失败 | - |

## 状态转换规则

### 1. arxivDataStatus: pending → processing

**触发条件**: 开始获取论文 arXiv 详细信息

**操作**: 更新 `arxivDataStatus` 为 `processing`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { arxivDataStatus: 'processing' }
});
```

**相关脚本**:
- [fetch-paper](../../scripts/arxiv/fetch-paper.md)
- [fetch-papers](../../scripts/arxiv/fetch-papers.md)

### 2. arxivDataStatus: processing → completed

**触发条件**: 成功从 arXiv API 获取数据

**操作**: 更新论文元数据，设置 `arxivDataStatus` 为 `completed`，记录 `arxivDataFetchedAt`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: {
    title: arxivData.title,
    abstract: arxivData.abstract,
    publishedDate: arxivData.publishedDate,
    primaryCategory: arxivData.primaryCategory,
    license: arxivData.license,
    updatedAtArxiv: arxivData.updatedAtArxiv,
    comment: arxivData.comment,
    journalRef: arxivData.journalRef,
    doi: arxivData.doi,
    arxivDataStatus: 'completed',
    arxivDataFetchedAt: new Date()
  }
});
```

**相关脚本**:
- [fetch-paper](../../scripts/arxiv/fetch-paper.md)
- [fetch-papers](../../scripts/arxiv/fetch-papers.md)

### 3. arxivDataStatus: processing → failed

**触发条件**: 获取 arXiv 详细信息过程中出现错误

**操作**: 设置 `arxivDataStatus` 为 `failed`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { arxivDataStatus: 'failed' }
});
```

**相关脚本**:
- [fetch-paper](../../scripts/arxiv/fetch-paper.md)
- [fetch-papers](../../scripts/arxiv/fetch-papers.md)

### 4. referencesStatus: pending → processing

**触发条件**: 开始获取论文引用文献

**操作**: 更新 `referencesStatus` 为 `processing`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { referencesStatus: 'processing' }
});
```

**相关脚本**:
- [fetch-reference](../../scripts/semantic-scholar/fetch-reference.md)
- [fetch-references](../../scripts/semantic-scholar/fetch-references.md)

### 5. referencesStatus: processing → completed

**触发条件**: 成功获取论文引用文献

**操作**: 更新 `referencesStatus` 为 `completed`，记录 `referencesFetchedAt`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { referencesStatus: 'completed', referencesFetchedAt: new Date() }
});
```

**相关脚本**:
- [fetch-reference](../../scripts/semantic-scholar/fetch-reference.md)
- [fetch-references](../../scripts/semantic-scholar/fetch-references.md)

### 6. referencesStatus: processing → failed

**触发条件**: 获取引用文献过程中出现错误

**操作**: 设置 `referencesStatus` 为 `failed`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { referencesStatus: 'failed' }
});
```

**相关脚本**:
- [fetch-reference](../../scripts/semantic-scholar/fetch-reference.md)
- [fetch-references](../../scripts/semantic-scholar/fetch-references.md)

### 7. citationsStatus: pending → processing

**触发条件**: 开始获取论文被引用情况

**操作**: 更新 `citationsStatus` 为 `processing`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { citationsStatus: 'processing' }
});
```

**相关脚本**:
- [fetch-citation](../../scripts/semantic-scholar/fetch-citation.md)
- [fetch-citations](../../scripts/semantic-scholar/fetch-citations.md)

### 8. citationsStatus: processing → completed

**触发条件**: 成功获取论文被引用情况

**操作**: 更新 `citationsStatus` 为 `completed`，记录 `citationsFetchedAt`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { citationsStatus: 'completed', citationsFetchedAt: new Date() }
});
```

**相关脚本**:
- [fetch-citation](../../scripts/semantic-scholar/fetch-citation.md)
- [fetch-citations](../../scripts/semantic-scholar/fetch-citations.md)

### 9. citationsStatus: processing → failed

**触发条件**: 获取被引用情况过程中出现错误

**操作**: 设置 `citationsStatus` 为 `failed`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { citationsStatus: 'failed' }
});
```

**相关脚本**:
- [fetch-citation](../../scripts/semantic-scholar/fetch-citation.md)
- [fetch-citations](../../scripts/semantic-scholar/fetch-citations.md)

## 引用文献获取状态转换

### 1. referencesStatus: pending -> processing

**触发条件**: 开始获取论文引用文献

**操作**: 更新 `referencesStatus` 为 `processing`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { referencesStatus: 'processing' }
});
```

**相关脚本**:
- [fetch-reference](../../scripts/semantic-scholar/fetch-reference.md)
- [fetch-references](../../scripts/semantic-scholar/fetch-references.md)

### 2. referencesStatus: processing -> completed

**触发条件**: 成功获取论文引用文献

**操作**: 更新 `referencesStatus` 为 `completed`，记录 `referencesFetchedAt`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { referencesStatus: 'completed', referencesFetchedAt: new Date() }
});
```

**相关脚本**:
- [fetch-reference](../../scripts/semantic-scholar/fetch-reference.md)
- [fetch-references](../../scripts/semantic-scholar/fetch-references.md)

### 3. referencesStatus: processing -> failed

**触发条件**: 获取引用文献过程中出现错误

**操作**: 设置 `referencesStatus` 为 `failed`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { referencesStatus: 'failed' }
});
```

**相关脚本**:
- [fetch-reference](../../scripts/semantic-scholar/fetch-reference.md)
- [fetch-references](../../scripts/semantic-scholar/fetch-references.md)

### 4. 重置引用文献获取状态

如果需要重新获取论文的引用文献，可以手动重置：

```typescript
// 将 referencesStatus 改回 pending
await prisma.arxivPaper.update({
  where: { arxivId: '2503.15888' },
  data: { referencesStatus: 'pending' }
});
```

然后重新运行获取引用文献的脚本：

```bash
# 获取单篇论文的引用文献
pnpm run fetch-reference 2503.15888

# 批量获取未获取引用文献的论文
pnpm run fetch-references
```

## 被引用情况获取状态转换

### 1. citationsStatus: pending -> processing

**触发条件**: 开始获取论文被引用情况

**操作**: 更新 `citationsStatus` 为 `processing`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { citationsStatus: 'processing' }
});
```

**相关脚本**:
- [fetch-citation](../../scripts/semantic-scholar/fetch-citation.md)
- [fetch-citations](../../scripts/semantic-scholar/fetch-citations.md)

### 2. citationsStatus: processing -> completed

**触发条件**: 成功获取论文被引用情况

**操作**: 更新 `citationsStatus` 为 `completed`，记录 `citationsFetchedAt`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { citationsStatus: 'completed', citationsFetchedAt: new Date() }
});
```

**相关脚本**:
- [fetch-citation](../../scripts/semantic-scholar/fetch-citation.md)
- [fetch-citations](../../scripts/semantic-scholar/fetch-citations.md)

### 3. citationsStatus: processing -> failed

**触发条件**: 获取被引用情况过程中出现错误

**操作**: 设置 `citationsStatus` 为 `failed`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { citationsStatus: 'failed' }
});
```

**相关脚本**:
- [fetch-citation](../../scripts/semantic-scholar/fetch-citation.md)
- [fetch-citations](../../scripts/semantic-scholar/fetch-citations.md)

### 4. 重置被引用情况获取状态

如果需要重新获取论文的被引用情况，可以手动重置：

```typescript
// 将 citationsStatus 改回 pending
await prisma.arxivPaper.update({
  where: { arxivId: '2503.15888' },
  data: { citationsStatus: 'pending' }
});
```

然后重新运行获取被引用情况的脚本：

```bash
# 获取单篇论文的被引用情况
pnpm run fetch-citation 2503.15888

# 批量获取未获取被引用情况的论文
pnpm run fetch-citations
```

## 状态查询

### 查询待处理论文

```typescript
const pendingPapers = await prisma.arxivPaper.findMany({
  where: { status: 'pending' },
  orderBy: { createdAt: 'asc' }
});
```

### 查询处理中的论文

```typescript
const processingPapers = await prisma.arxivPaper.findMany({
  where: { status: 'processing' }
});
```

### 查询已完成的论文

```typescript
const completedPapers = await prisma.arxivPaper.findMany({
  where: { status: 'completed' }
});
```

### 查询失败的论文

```typescript
const failedPapers = await prisma.arxivPaper.findMany({
  where: { status: 'failed' }
});
```

### 查询未获取引用文献的论文

```typescript
const unfetchedPapers = await prisma.arxivPaper.findMany({
  where: { referencesFetched: false },
  orderBy: { createdAt: 'asc' }
});
```

### 查询已获取引用文献的论文

```typescript
const fetchedPapers = await prisma.arxivPaper.findMany({
  where: { referencesFetched: true }
});
```

## 状态重置

### 重试失败的论文

如果论文处理失败，可以手动重试：

```typescript
// 将状态从 failed 改回 pending
await prisma.arxivPaper.update({
  where: { arxivId: '2503.15888' },
  data: { status: 'pending' }
});
```

然后重新运行处理脚本：

```bash
pnpm run process-papers
```

或使用 Prisma Studio 手动修改状态：

```bash
pnpm run prisma:studio
```

## 注意事项

1. **状态唯一性**: 每篇论文在同一时间只能处于一个状态
2. **状态转换**: 状态转换是单向的，不能从 `completed` 或 `failed` 回退到 `processing`
3. **重试机制**: 失败的论文需要手动重置状态后才能重新处理
4. **并发处理**: 当前实现为串行处理，同一时间只有一篇论文处于 `processing` 状态

## 相关文档

- [Arxiv 数据表说明](./arxiv.md) - ArxivPaper 表详细说明
- [处理单个论文](../../scripts/arxiv/process-paper.md) - process-paper 脚本使用说明
- [批量处理论文](../../scripts/arxiv/process-papers.md) - process-papers 脚本使用说明
- [错误处理](../architecture/error-handling.md) - 错误处理机制
