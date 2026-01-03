# 脚本文档

本目录包含项目脚本的使用说明文档。

## 文档结构

### Arxiv 脚本

- [arxiv/fetch-paper.md](./arxiv/fetch-paper.md) - 获取单个 arXiv 论文的详细信息
- [arxiv/fetch-papers.md](./arxiv/fetch-papers.md) - 批量获取所有待处理的 arXiv 论文的详细信息

### Semantic Scholar 脚本

- [semantic-scholar/fetch-reference.md](./semantic-scholar/fetch-reference.md) - 获取指定论文的引用文献
- [semantic-scholar/fetch-references.md](./semantic-scholar/fetch-references.md) - 批量获取所有未获取引用文献的论文
- [semantic-scholar/fetch-citation.md](./semantic-scholar/fetch-citation.md) - 获取指定论文的被引用情况
- [semantic-scholar/fetch-citations.md](./semantic-scholar/fetch-citations.md) - 批量获取所有未获取被引用情况的论文

## 前置条件

在使用任何脚本之前，需要完成以下步骤：

### 1. 初始化数据库

```bash
# 生成 Prisma Client
pnpm run prisma:generate

# 创建数据库迁移
pnpm run prisma:migrate
```

### 2. 添加论文到数据库

```bash
# 运行 seed 脚本，将 start.ts 中的论文添加到数据库
pnpm run prisma:seed
```

## 脚本命令概览

| 命令 | 说明 |
|------|------|
| `pnpm run fetch-paper <arxivId>` | 获取单个 arXiv 论文的详细信息 |
| `pnpm run fetch-papers` | 批量获取所有待处理的 arXiv 论文的详细信息 |
| `pnpm run fetch-reference <arxivId>` | 获取指定论文的引用文献 |
| `pnpm run fetch-references` | 批量获取所有未获取引用文献的论文 |
| `pnpm run fetch-citation <arxivId>` | 获取指定论文的被引用情况 |
| `pnpm run fetch-citations` | 批量获取所有未获取被引用情况的论文 |

## 相关文档

- [数据库文档](../database/README.md)
- [架构设计文档](../architecture/)
