# 引用文献获取使用说明

## 概述

`fetch-references` 脚本用于获取指定 arXiv 论文的引用文献，并将这些引用文献添加到数据库中，同时建立论文之间的引用关系。

## 功能特性

- 自动获取指定论文的引用文献
- 智能识别 arXiv 论文并过滤非 arXiv 引用
- 自动创建不存在的论文记录
- 建立论文之间的引用关系
- 避免重复创建论文和引用关系
- 详细的处理日志输出

## 使用方法

### 基本用法

```bash
pnpm run fetch-references <arxivId>
```

### 参数说明

- `arxivId`: 必需参数，指定要获取引用文献的论文 arXiv ID
  - 示例: `2503.15888`
  - 示例: `2401.12345`

### 使用示例

```bash
# 获取论文 2503.15888 的引用文献
pnpm run fetch-references 2503.15888

# 获取论文 2401.12345 的引用文献
pnpm run fetch-references 2401.12345
```

## 处理流程

### 1. 查找或创建源论文

脚本首先检查数据库中是否存在指定的论文：

- 如果存在：使用现有论文记录
- 如果不存在：创建新的论文记录，状态为 `pending`

### 2. 获取引用文献

从 Semantic Scholar API 获取论文的引用文献列表：

- API 端点: `https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxivId}`
- 获取字段: 标题、作者、arXiv ID、年份、发布日期

### 3. 处理每篇引用文献

对每篇引用文献执行以下操作：

#### 3.1 检查论文是否已存在

- 如果存在：跳过创建，使用现有记录
- 如果不存在：创建新的论文记录，状态为 `pending`

#### 3.2 创建引用关系

- 检查引用关系是否已存在
- 如果不存在：创建新的引用关系
- 如果已存在：跳过创建

### 4. 输出处理结果

脚本会输出以下统计信息：

- 新增论文数量
- 已存在论文数量
- 新增引用关系数量

## 输出示例

```
============================================================
开始获取论文引用文献: 2503.15888
============================================================
论文 2503.15888 不存在于数据库中，正在创建...
论文 2503.15888 已创建

正在获取引用文献...
找到 15 篇 arXiv 引用文献

开始处理 15 篇引用文献...
============================================================

处理引用文献: 2401.12345
  创建新论文记录: 2401.12345
  论文 2401.12345 已创建
  引用关系已创建

处理引用文献: 2312.56789
  论文 2312.56789 已存在
  引用关系已创建

...

============================================================
处理完成
  新增论文: 12
  已存在论文: 3
  新增引用关系: 15
============================================================
```

## 数据结构

### 论文引用关系

数据库使用 `Reference` 表维护论文之间的引用关系：

```typescript
{
  id: string;              // UUID
  paperId: string;        // 源论文 ID
  referenceId: string;     // 引用论文 ID
  createdAt: Date;        // 创建时间
}
```

### 关系说明

- `paperId`: 引用其他论文的论文（源论文）
- `referenceId`: 被引用的论文
- 一篇论文可以引用多篇论文
- 一篇论文可以被多篇论文引用
- `arxivId` 在 `Paper` 表中是唯一的，确保全局唯一性

## 注意事项

### 1. API 限制

- Semantic Scholar API 有请求频率限制
- 建议不要频繁调用脚本
- 如果遇到限流错误，请等待一段时间后重试

### 2. 数据完整性

- 只有 arXiv 论文会被添加到数据库
- 非 arXiv 引用会被自动过滤
- 论文状态默认为 `pending`，需要使用 `process-papers` 脚本处理

### 3. 重复执行

- 脚本可以安全地重复执行
- 已存在的论文和引用关系不会被重复创建
- 每次执行都会输出详细的处理日志

### 4. 错误处理

- 如果 API 请求失败，脚本会抛出错误并终止
- 建议检查网络连接和 API 可用性
- 查看错误日志以了解具体问题

## 相关命令

### 处理论文数据

获取引用文献后，使用以下命令处理论文数据：

```bash
# 处理所有待处理的论文
pnpm run process-papers

# 处理指定的论文
pnpm run process-paper <arxivId>
```

### 查看数据库

```bash
# 使用 Prisma Studio 查看数据库
pnpm run prisma:studio
```

## 常见问题

### Q: 为什么有些引用文献没有被添加？

A: 脚本只添加 arXiv 论文，非 arXiv 引用会被自动过滤。

### Q: 如何查看论文的引用关系？

A: 使用 Prisma Studio 打开数据库，查看 `Reference` 表中的记录。

### Q: 可以批量获取多篇论文的引用文献吗？

A: 当前版本不支持批量获取，需要逐篇执行脚本。

### Q: 如果论文已经存在，会更新其数据吗？

A: 不会。如果论文已存在，脚本会跳过创建，使用现有记录。如需更新数据，请使用 `process-papers` 脚本。

### Q: 引用关系是双向的吗？

A: 不是。引用关系是单向的：论文 A 引用论文 B，只表示 A -> B 的关系。如果 B 也引用 A，需要单独获取 B 的引用文献。

## 相关文件

- [scripts/fetch-references.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/scripts/fetch-references.ts) - 引用文献获取脚本
- [src/lib/arxiv/fetch-references.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/src/lib/arxiv/fetch-references.ts) - 引用文献获取逻辑
- [scripts/process-papers.ts](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/scripts/process-papers.ts) - 论文处理脚本
- [docs/BUSINESS_LOGIC.md](file:///Volumes/JZAO/j-projects/yc-w-cn/connected-papers/docs/BUSINESS_LOGIC.md) - 业务逻辑文档

## 依赖说明

本脚本依赖以下库：

- `@prisma/client`: 数据库 ORM
- `fast-xml-parser`: XML 解析（用于 arXiv API）
- `tsx`: TypeScript 执行器

安装命令：
```bash
pnpm install
```
