# Prisma 数据用途说明

## 概述

本项目使用 Prisma 作为 ORM 工具，配合 SQLite 数据库来存储和管理 arXiv 论文数据。

## 数据库配置

- **数据库类型**: SQLite
- **数据库文件**: `prisma/dev.db`
- **Prisma Schema**: `prisma/schema.prisma`

## 数据模型

### ArxivPaper 模型

存储 arXiv 论文的基本信息和处理状态。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 论文唯一标识符 | 主键，UUID |
| `arxivId` | String | arXiv 论文 ID | 唯一索引 |
| `arxivUrl` | String | arXiv 论文完整 URL | 必填 |
| `title` | String? | 论文标题 | 可选 |
| `abstract` | String? | 论文摘要 | 可选 |
| `publishedDate` | String? | 发布日期 | 可选 |
| `primaryCategory` | String? | 主分类 | 可选 |
| `license` | String? | 许可证 | 可选 |
| `updatedAtArxiv` | String? | arXiv 更新时间 | 可选 |
| `comment` | String? | 评论 | 可选 |
| `journalRef` | String? | 期刊引用 | 可选 |
| `doi` | String? | DOI | 可选 |
| `status` | String | 处理状态 | 默认值: `pending` |
| `processedAt` | DateTime? | 处理完成时间 | 可选 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |
| `updatedAt` | DateTime | 更新时间 | 自动更新 |

#### 状态枚举

`status` 字段支持以下值：

- **`pending`**: 待处理 - 论文已添加到数据库，但尚未开始处理
- **`processing`**: 处理中 - 正在从 arXiv API 获取论文数据
- **`completed`**: 已完成 - 论文数据已成功获取并保存
- **`failed`**: 失败 - 处理过程中出现错误

### SemanticScholarPaper 模型

存储 Semantic Scholar API 获取的论文数据。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 记录唯一标识符 | 主键，UUID |
| `paperId` | String | Semantic Scholar 论文 ID | 唯一索引 |
| `url` | String? | Semantic Scholar 论文 URL | 可选 |
| `citationCount` | Int? | 引用次数 | 可选 |
| `influentialCitationCount` | Int? | 影响力引用次数 | 可选 |
| `openAccessPdfUrl` | String? | 开放访问 PDF 链接 | 可选 |
| `publicationTypes` | String? | 发表类型（逗号分隔） | 可选 |
| `arxivPaperId` | String | 关联的 arXiv 论文 ID | 唯一索引，外键 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |
| `updatedAt` | DateTime | 更新时间 | 自动更新 |

### SemanticScholarAuthor 模型

存储 Semantic Scholar 作者信息。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 作者记录唯一标识符 | 主键，UUID |
| `authorId` | String? | Semantic Scholar 作者 ID | 可选，索引 |
| `name` | String | 作者姓名 | 必填 |
| `arxivPaperId` | String | 关联的论文 ID | 外键，索引 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |

### SemanticScholarFieldOfStudy 模型

存储论文的研究领域信息。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 记录唯一标识符 | 主键，UUID |
| `field` | String | 研究领域名称 | 必填，索引 |
| `category` | String? | 分类 | 可选 |
| `arxivPaperId` | String | 关联的论文 ID | 外键，索引 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |

### SemanticScholarVenue 模型

存储论文的发表场所信息。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 记录唯一标识符 | 主键，UUID |
| `venue` | String? | 发表场所（会议/期刊名称） | 可选 |
| `volume` | String? | 卷号 | 可选 |
| `issue` | String? | 期号 | 可选 |
| `pages` | String? | 页码 | 可选 |
| `arxivPaperId` | String | 关联的论文 ID | 唯一索引，外键 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |

### ArxivAuthorName 模型

存储论文作者的详细信息。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 作者记录唯一标识符 | 主键，UUID |
| `name` | String | 作者姓名 | 必填 |
| `affiliation` | String? | 作者所属机构 | 可选 |
| `arxivPaperId` | String | 关联的论文 ID | 外键，索引 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |

### ArxivCategory 模型

存储论文的分类信息。

#### 字段说明

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | String | 分类记录唯一标识符 | 主键，UUID |
| `category` | String | 分类名称 | 必填 |
| `arxivPaperId` | String | 关联的论文 ID | 外键，索引 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |

## 使用场景

### 1. 论文数据存储

存储从 arXiv 获取的论文元数据，包括：
- 标题
- 摘要
- 发布日期
- arXiv 链接
- 主分类
- 所有分类
- 许可证
- arXiv 更新时间
- 评论
- 期刊引用
- DOI

### 2. Semantic Scholar 数据存储

存储从 Semantic Scholar API 获取的论文数据，包括：
- Semantic Scholar 论文 ID 和 URL
- 引用统计（citationCount、influentialCitationCount）
- 开放访问 PDF 链接
- 发表类型
- 作者信息（含 Semantic Scholar 作者 ID）
- 研究领域（s2FieldsOfStudy）
- 发表场所信息（venue、volume、issue、pages）

### 3. 作者信息存储

存储论文作者的详细信息：
- 作者姓名
- 作者所属机构（arXiv）
- Semantic Scholar 作者 ID
- 与论文的关联关系

### 4. 分类信息存储

存储论文的分类信息：
- 主分类（arXiv）
- 所有分类（arXiv）
- 研究领域（Semantic Scholar）
- 研究领域分类（Semantic Scholar）
- 与论文的关联关系

### 5. 处理状态追踪

追踪每篇论文的处理进度：
- 避免重复处理同一篇论文
- 支持断点续传（从失败或未完成的状态继续）
- 记录处理时间

### 6. 批量处理管理

支持批量处理多篇论文：
- 按创建时间排序处理
- 并发控制（一次处理一篇）
- 错误隔离（单篇失败不影响其他）

### 7. 引用关系管理

管理论文之间的引用关系：
- 记录论文引用的其他论文
- 支持构建论文引用网络
- 避免重复创建引用关系

## 数据库操作

### 初始化

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm run prisma:generate

# 创建数据库迁移
pnpm run prisma:migrate
```

### 数据填充

```bash
# 运行 seed 脚本，将 start.ts 中的论文添加到数据库
pnpm run prisma:seed
```

### 数据处理

```bash
# 处理所有待处理的论文
pnpm run process-papers
```

### 数据库管理

```bash
# 打开 Prisma Studio 可视化界面
pnpm run prisma:studio
```

## 数据库文件位置

- **开发环境**: `prisma/dev.db`
- **迁移文件**: `prisma/migrations/`

## 注意事项

1. **数据库文件**: SQLite 数据库文件存储在 `prisma/dev.db`，不应提交到版本控制
2. **迁移文件**: 迁移文件应提交到版本控制，确保团队数据库结构一致
3. **环境变量**: 当前使用开发环境配置，生产环境需要配置 `DATABASE_URL`
4. **并发处理**: 当前实现为串行处理，如需并发处理需要修改脚本逻辑

## 扩展建议

未来可以考虑扩展以下功能：

1. **引用关系**: 添加论文之间的引用关系（已实现）
2. **分类标签**: 添加论文分类和标签系统（已实现）
3. **评分系统**: 添加论文评分和评论功能
4. **搜索索引**: 优化论文搜索性能
5. **缓存机制**: 添加 arXiv API 响应缓存
6. **作者网络**: 基于作者 ID 构建作者合作网络
7. **研究领域分析**: 分析论文的研究领域分布
8. **引用影响力**: 基于引用统计评估论文影响力
9. **开放访问追踪**: 追踪开放访问论文的分布情况
10. **发表场所分析**: 分析论文发表的会议和期刊分布
