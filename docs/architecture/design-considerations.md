# 设计考虑

## 概述

本文档详细说明了系统设计中的各种考虑因素，包括性能优化、监控日志、安全考虑和未来扩展计划。

## 性能考虑

### 当前实现

- **串行处理**: 一次只处理一篇论文
- **无并发控制**: 不支持同时处理多篇论文
- **无速率限制**: 没有对 API 请求频率进行控制

### 优化建议

#### 1. 并发处理

使用 Promise.all 或 Worker 线程池实现并发处理，限制并发数量（如 3-5 个）。

```typescript
// 使用 Promise.all 并发处理
const batchSize = 3;
for (let i = 0; i < pendingPapers.length; i += batchSize) {
  const batch = pendingPapers.slice(i, i + batchSize);
  await Promise.all(batch.map(paper => processPaper(paper)));
}
```

#### 2. 速率限制

遵守 arXiv API 使用规范，添加请求间隔（如 1 秒）。

```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

await delay(1000); // 等待 1 秒
const response = await fetch(apiUrl);
```

#### 3. 批量查询

支持一次查询多篇论文，减少 API 调用次数。

```typescript
// arXiv API 支持批量查询
const arxivIds = ['2503.15888', '2503.15889', '2503.15890'];
const apiUrl = `https://export.arxiv.org/api/query?id_list=${arxivIds.join(',')}`;
```

#### 4. 缓存机制

缓存已获取的论文数据，避免重复请求。

```typescript
// 使用内存缓存或 Redis
const cache = new Map();

async function fetchPaper(arxivId: string) {
  if (cache.has(arxivId)) {
    return cache.get(arxivId);
  }

  const data = await fetchFromAPI(arxivId);
  cache.set(arxivId, data);
  return data;
}
```

## 监控和日志

### 日志输出

处理过程中的关键事件都会输出到控制台：

- 开始处理论文
- 论文处理完成
- 论文处理失败
- 错误详情

### 监控指标

建议监控以下指标：

1. **待处理论文数量**
   - 查询状态为 `pending` 的论文数量
   - 用于了解待处理工作量

2. **处理成功率**
   - 成功处理的论文数量 / 总处理论文数量
   - 用于评估系统稳定性

3. **平均处理时间**
   - 每篇论文的平均处理时间
   - 用于识别性能瓶颈

4. **失败率**
   - 失败处理的论文数量 / 总处理论文数量
   - 用于识别常见错误

### 日志示例

```typescript
console.log(`开始处理论文: ${arxivId}`);
console.log(`论文处理完成: ${arxivId}`);
console.error(`论文处理失败: ${arxivId}`, error);
```

## 安全考虑

### 1. 输入验证

验证 arXiv URL 格式，防止无效输入。

```typescript
function validateArxivId(arxivId: string): boolean {
  // arXiv ID 格式: YYMM.NNNNN 或 YYMM.NNNNNvV
  const regex = /^\d{4}\.\d{4,5}(v\d+)?$/;
  return regex.test(arxivId);
}

if (!validateArxivId(arxivId)) {
  throw new Error('无效的 arXiv ID 格式');
}
```

### 2. 错误信息

不暴露敏感信息，记录详细的错误日志用于调试。

```typescript
try {
  await processPaper(arxivId);
} catch (error) {
  // 用户看到的错误信息
  console.error(`论文处理失败: ${arxivId}`);

  // 详细错误日志（用于调试）
  console.error('详细错误:', error);
}
```

### 3. API 使用

遵守 arXiv API 使用条款，添加适当的请求头。

```typescript
const response = await fetch(apiUrl, {
  headers: {
    'User-Agent': 'Connected-Papers/1.0',
  },
});
```

## 未来扩展

### 计划功能

#### 1. 增量更新

支持更新已存在的论文数据，检测论文版本变化。

```typescript
async function updatePaper(arxivId: string) {
  const existingPaper = await prisma.arxivPaper.findUnique({
    where: { arxivId }
  });

  const newData = await fetchFromAPI(arxivId);

  // 检查版本是否变化
  if (newData.updatedAtArxiv !== existingPaper.updatedAtArxiv) {
    await prisma.arxivPaper.update({
      where: { arxivId },
      data: newData
    });
  }
}
```

#### 2. 引用关系

获取论文的引用和被引用关系，构建论文网络。

```typescript
// 获取论文的引用文献
const references = await fetchReferences(arxivId);

// 获取引用该论文的论文
const citedBy = await fetchCitedBy(arxivId);

// 构建论文网络
const network = buildPaperNetwork(references, citedBy);
```

#### 3. 批量操作

支持批量添加论文，支持批量导出数据。

```typescript
// 批量添加论文
async function addPapers(arxivIds: string[]) {
  for (const arxivId of arxivIds) {
    await addPaper(arxivId);
  }
}

// 批量导出数据
async function exportPapers(format: 'json' | 'csv') {
  const papers = await prisma.arxivPaper.findMany();
  return convertToFormat(papers, format);
}
```

#### 4. Web 界面

提供网页界面管理论文，实时查看处理进度。

```typescript
// Next.js API 路由
app.get('/api/papers', async (req, res) => {
  const papers = await prisma.arxivPaper.findMany();
  res.json(papers);
});

// 实时进度更新
app.get('/api/papers/progress', async (req, res) => {
  const progress = await getProcessingProgress();
  res.json(progress);
});
```

#### 5. 通知机制

处理完成后发送通知，失败时发送告警。

```typescript
// 发送通知
async function sendNotification(message: string) {
  // 支持邮件、短信、Slack 等多种通知方式
  await emailService.send(message);
}

// 处理完成通知
await sendNotification(`论文 ${arxivId} 处理完成`);

// 失败告警
await sendNotification(`论文 ${arxivId} 处理失败: ${error.message}`);
```

## 相关文档

- [状态机设计](../database/state-machine.md) - 论文处理状态管理
- [API 集成](../database/api-integration.md) - 外部 API 使用说明
- [错误处理](./error-handling.md) - 错误处理机制
