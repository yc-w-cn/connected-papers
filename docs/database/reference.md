# 引用关系表说明

## 概述

Reference 表用于维护论文之间的引用关系，包括引用文献和被引用情况。

## 数据模型

### Reference 模型

维护论文之间的引用关系。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 记录唯一标识符 | 主键，UUID |
| `paperId` | String | 源论文 ID | 外键，索引 |
| `referenceId` | String | 引用论文 ID | 外键，索引 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |

#### 唯一约束

- `paperId` + `referenceId` 组合唯一，确保同一对论文的引用关系不会重复

## 使用场景

### 1. 引用文献管理

管理论文引用的其他论文：
- 记录论文引用的其他论文（references）
- 支持构建论文引用网络
- 避免重复创建引用关系

### 2. 被引用情况管理

管理引用某篇论文的其他论文：
- 记录引用该论文的其他论文（citations）
- 支持构建论文被引用网络
- 避免重复创建被引用关系

### 3. 引用网络构建

通过引用关系可以：
- 查找论文的所有引用文献
- 查找引用某篇论文的所有论文
- 构建论文之间的引用图谱

## 关系说明

- `paperId`: 引用其他论文的论文（源论文）
- `referenceId`: 被引用的论文
- 一篇论文可以引用多篇论文
- 一篇论文可以被多篇论文引用
- `arxivId` 在 `Paper` 表中是唯一的，确保全局唯一性
- `SemanticScholarPaper` 与 `ArxivPaper` 是一对一关系
- `SemanticScholarPaper` 可以有多位作者（`authors`）
- `SemanticScholarPaper` 可以有多个研究领域（`fieldsOfStudy`）
- `SemanticScholarPaper` 可以有一个发表场所信息（`venue`）

## 使用示例

### 查找论文的引用文献

```typescript
const references = await prisma.reference.findMany({
  where: { paperId: sourcePaperId },
  include: {
    reference: true
  }
});
```

### 查找引用某篇论文的所有论文

```typescript
const citedBy = await prisma.reference.findMany({
  where: { referenceId: targetPaperId },
  include: {
    paper: true
  }
});
```

## 相关文档

- [Arxiv 数据表说明](./arxiv.md)
- [Semantic Scholar 数据表说明](./semantic-scholar.md)
- [数据库总览](./README.md)
