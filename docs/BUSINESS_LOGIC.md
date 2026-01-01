# 论文处理业务逻辑说明

## 概述

本文档详细说明 arXiv 论文处理的完整业务逻辑，包括数据流转、状态管理和处理流程。

## 业务流程

### 1. 论文添加流程

#### 触发条件
- 用户通过 `scripts/start.ts` 配置初始论文
- 手动执行 seed 脚本添加论文

#### 处理步骤
1. 从 `scripts/start.ts` 读取 arXiv 论文 URL
2. 解析 URL 提取 arXiv ID（例如：`2503.15888`）
3. 检查数据库中是否已存在该论文
   - 如果存在，跳过添加
   - 如果不存在，创建新记录
4. 创建论文记录，初始状态为 `pending`

#### 相关文件
- [scripts/start.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/scripts/start.ts)
- [prisma/seed.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/prisma/seed.ts)

### 2. 论文处理流程

#### 触发条件
- 执行 `pnpm run process-papers` 命令
- 脚本自动查找所有状态为 `pending` 的论文

#### 处理步骤

##### 2.1 查找待处理论文
```typescript
// 查询所有状态为 pending 的论文，按创建时间升序排列
const pendingPapers = await prisma.paper.findMany({
  where: { status: 'pending' },
  orderBy: { createdAt: 'asc' }
});
```

##### 2.2 逐篇处理论文
对每篇待处理论文执行以下操作：

**步骤 1: 更新状态为处理中**
```typescript
await prisma.paper.update({
  where: { id: paper.id },
  data: { status: 'processing' }
});
```

**步骤 2: 从 arXiv API 获取论文数据**
```typescript
// 使用 arXiv API 获取论文元数据
const response = await fetch(`https://export.arxiv.org/api/query?id_list=${arxivId}`);
```

**步骤 3: 解析 XML 响应**
- 解析 arXiv API 返回的 XML 数据
- 提取以下字段：
  - `title`: 论文标题
  - `summary`: 论文摘要
  - `authors`: 作者列表
  - `published`: 发布日期

**步骤 4: 更新数据库记录**
```typescript
await prisma.paper.update({
  where: { id: paper.id },
  data: {
    title: arxivData.title,
    authors: arxivData.authors,
    abstract: arxivData.abstract,
    publishedDate: arxivData.publishedDate,
    status: 'completed',
    processedAt: new Date()
  }
});
```

**步骤 5: 错误处理**
如果处理过程中出现错误：
```typescript
// 将状态更新为 failed
await prisma.paper.update({
  where: { id: paper.id },
  data: { status: 'failed' }
});
```

#### 相关文件
- [scripts/process-papers.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/scripts/process-papers.ts)
- [src/lib/arxiv/fetch-paper.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/src/lib/arxiv/fetch-paper.ts)

### 3. 引用文献获取流程

#### 触发条件
- 执行 `pnpm run fetch-references <arxivId>` 命令
- 指定要获取引用文献的论文 arXiv ID

#### 处理步骤

##### 3.1 查找或创建源论文
```typescript
let paper = await prisma.paper.findUnique({
  where: { arxivId }
});

if (!paper) {
  paper = await prisma.paper.create({
    data: {
      arxivId,
      arxivUrl: `https://arxiv.org/abs/${arxivId}`,
      status: 'pending'
    }
  });
}
```

##### 3.2 从 Semantic Scholar API 获取引用文献
```typescript
const response = await fetch(
  `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=references.title,references.authors,references.arxivId,references.year,references.publicationDate`
);
```

##### 3.3 处理每篇引用文献
对每篇引用文献执行以下操作：

**步骤 1: 检查论文是否已存在**
```typescript
let refPaper = await prisma.paper.findUnique({
  where: { arxivId: ref.arxivId }
});
```

**步骤 2: 创建或更新引用论文**
```typescript
if (!refPaper) {
  refPaper = await prisma.paper.create({
    data: {
      arxivId: ref.arxivId,
      arxivUrl: ref.arxivUrl,
      title: ref.title,
      authors: ref.authors,
      abstract: ref.abstract,
      publishedDate: ref.publishedDate,
      status: 'pending'
    }
  });
}
```

**步骤 3: 创建引用关系**
```typescript
const existingReference = await prisma.reference.findUnique({
  where: {
    paperId_referenceId: {
      paperId: paper.id,
      referenceId: refPaper.id
    }
  }
});

if (!existingReference) {
  await prisma.reference.create({
    data: {
      paperId: paper.id,
      referenceId: refPaper.id
    }
  });
}
```

#### 相关文件
- [scripts/fetch-references.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/scripts/fetch-references.ts)
- [src/lib/arxiv/fetch-references.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/src/lib/arxiv/fetch-references.ts)

## 状态机设计

### 状态转换图

```
pending -> processing -> completed
    |
    v
  failed
```

### 状态说明

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 论文已添加，等待处理 | `processing` |
| `processing` | 正在从 arXiv API 获取数据 | `completed`, `failed` |
| `completed` | 数据获取成功，处理完成 | - |
| `failed` | 处理过程中出现错误 | - |

### 状态转换规则

1. **pending → processing**
   - 触发条件：开始处理论文
   - 操作：更新 `status` 为 `processing`

2. **processing → completed**
   - 触发条件：成功从 arXiv API 获取数据
   - 操作：更新论文元数据，设置 `status` 为 `completed`，记录 `processedAt`

3. **processing → failed**
   - 触发条件：处理过程中出现错误
   - 操作：设置 `status` 为 `failed`

## 数据结构

### Paper 实体

```typescript
{
  id: string;              // UUID
  arxivId: string;         // arXiv 论文 ID (唯一)
  arxivUrl: string;        // 完整 URL
  title: string | null;     // 标题
  authors: string | null;  // 作者列表
  abstract: string | null; // 摘要
  publishedDate: string | null; // 发布日期
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt: Date | null; // 处理完成时间
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

### Reference 实体

```typescript
{
  id: string;              // UUID
  paperId: string;        // 源论文 ID
  referenceId: string;     // 引用论文 ID
  createdAt: Date;        // 创建时间
}
```

### 关系说明

- 一个 `Paper` 可以有多篇引用文献（`references`）
- 一个 `Paper` 可以被多篇论文引用（`citedBy`）
- `Reference` 表维护论文之间的引用关系
- `arxivId` 在 `Paper` 表中是唯一的，确保全局唯一性

## API 集成

### arXiv API

**端点**: `https://export.arxiv.org/api/query?id_list={arxivId}`

**请求示例**:
```
GET https://export.arxiv.org/api/query?id_list=2503.15888
```

**响应格式**: XML

**响应示例**:
```xml
<entry>
  <title>论文标题</title>
  <summary>论文摘要</summary>
  <published>2025-03-25T00:00:00Z</published>
  <author>
    <name>作者1</name>
  </author>
  <author>
    <name>作者2</name>
  </author>
</entry>
```

### Semantic Scholar API

**端点**: `https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxivId}?fields={fields}`

**请求示例**:
```
GET https://api.semanticscholar.org/graph/v1/paper/arXiv:2503.15888?fields=references.title,references.authors,references.arxivId,references.year,references.publicationDate
```

**响应格式**: JSON

**响应示例**:
```json
{
  "references": [
    {
      "arxivId": "2401.12345",
      "title": "引用论文标题",
      "authors": [
        {"name": "作者1"},
        {"name": "作者2"}
      ],
      "year": 2024,
      "publicationDate": "2024-01-15"
    }
  ]
}
```

**字段说明**:
- `references.arxivId`: 引用论文的 arXiv ID
- `references.title`: 引用论文标题
- `references.authors`: 引用论文作者列表
- `references.year`: 引用论文年份
- `references.publicationDate`: 引用论文发布日期

## 错误处理

### 错误类型

1. **网络错误**
   - arXiv API 无法访问
   - 请求超时
   - 处理方式：标记为 `failed`，记录错误日志

2. **数据解析错误**
   - XML 格式错误
   - 缺少必要字段
   - 处理方式：标记为 `failed`，记录错误日志

3. **数据库错误**
   - 数据库连接失败
   - 数据写入失败
   - 处理方式：抛出异常，终止处理流程

### 重试机制

当前实现不支持自动重试，失败的论文需要手动干预：

1. 检查错误日志
2. 修复问题（如网络连接）
3. 将状态从 `failed` 改回 `pending`
4. 重新运行处理脚本

## 使用示例

### 添加新论文

```bash
# 1. 编辑 scripts/start.ts，设置论文 URL
# 2. 运行 seed 脚本
pnpm run prisma:seed
```

### 处理论文

```bash
# 处理所有待处理的论文
pnpm run process-papers

# 处理指定的论文
pnpm run process-paper 2503.15888
```

### 获取引用文献

```bash
# 获取指定论文的引用文献
pnpm run fetch-references 2503.15888
```

### 查看数据

```bash
# 使用 Prisma Studio 查看数据库
pnpm run prisma:studio
```

## 性能考虑

### 当前实现
- 串行处理：一次只处理一篇论文
- 无并发控制
- 无速率限制

### 优化建议

1. **并发处理**
   - 使用 Promise.all 或 Worker 线程池
   - 限制并发数量（如 3-5 个）

2. **速率限制**
   - 遵守 arXiv API 使用规范
   - 添加请求间隔（如 1 秒）

3. **批量查询**
   - 支持一次查询多篇论文
   - 减少 API 调用次数

4. **缓存机制**
   - 缓存已获取的论文数据
   - 避免重复请求

## 监控和日志

### 日志输出

处理过程中的关键事件都会输出到控制台：

- 开始处理论文
- 论文处理完成
- 论文处理失败
- 错误详情

### 监控指标

建议监控以下指标：

1. 待处理论文数量
2. 处理成功率
3. 平均处理时间
4. 失败率

## 安全考虑

1. **输入验证**
   - 验证 arXiv URL 格式
   - 防止 SQL 注入（Prisma 自动处理）

2. **错误信息**
   - 不暴露敏感信息
   - 记录详细的错误日志用于调试

3. **API 使用**
   - 遵守 arXiv API 使用条款
   - 添加适当的请求头

## 未来扩展

### 计划功能

1. **增量更新**
   - 支持更新已存在的论文数据
   - 检测论文版本变化

2. **引用关系**
   - 获取论文的引用和被引用关系
   - 构建论文网络

3. **批量操作**
   - 支持批量添加论文
   - 支持批量导出数据

4. **Web 界面**
   - 提供网页界面管理论文
   - 实时查看处理进度

5. **通知机制**
   - 处理完成后发送通知
   - 失败时发送告警
