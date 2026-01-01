# 状态机设计

## 概述

论文处理系统使用状态机来管理论文的处理流程，确保每篇论文的处理状态清晰可追踪。

## 状态转换图

```
pending -> processing -> completed
    |
    v
  failed
```

## 状态说明

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 论文已添加，等待处理 | `processing` |
| `processing` | 正在从 arXiv API 获取数据 | `completed`, `failed` |
| `completed` | 数据获取成功，处理完成 | - |
| `failed` | 处理过程中出现错误 | - |

## 状态转换规则

### 1. pending → processing

**触发条件**: 开始处理论文

**操作**: 更新 `status` 为 `processing`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { status: 'processing' }
});
```

**相关脚本**:
- [process-paper](../../scripts/arxiv/process-paper.md)
- [process-papers](../../scripts/arxiv/process-papers.md)

### 2. processing → completed

**触发条件**: 成功从 arXiv API 获取数据

**操作**: 更新论文元数据，设置 `status` 为 `completed`，记录 `processedAt`

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
    status: 'completed',
    processedAt: new Date()
  }
});
```

**相关脚本**:
- [process-paper](../../scripts/arxiv/process-paper.md)
- [process-papers](../../scripts/arxiv/process-papers.md)

### 3. processing → failed

**触发条件**: 处理过程中出现错误

**操作**: 设置 `status` 为 `failed`

```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { status: 'failed' }
});
```

**相关脚本**:
- [process-paper](../../scripts/arxiv/process-paper.md)
- [process-papers](../../scripts/arxiv/process-papers.md)

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
