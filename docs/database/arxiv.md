# Arxiv 数据表说明

## 概述

Arxiv 相关数据表用于存储从 arXiv API 获取的论文数据。

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
| `arxivDataStatus` | String | arXiv 数据获取状态 | 默认值: `pending` |
| `arxivDataFetchedAt` | DateTime? | arXiv 数据获取完成时间 | 可选 |
| `referencesStatus` | String | 引用文献获取状态 | 默认值: `pending` |
| `referencesFetchedAt` | DateTime? | 引用文献获取完成时间 | 可选 |
| `citationsStatus` | String | 被引用情况获取状态 | 默认值: `pending` |
| `citationsFetchedAt` | DateTime? | 被引用情况获取完成时间 | 可选 |
| `createdAt` | DateTime | 创建时间 | 自动生成 |
| `updatedAt` | DateTime | 更新时间 | 自动更新 |

#### 状态枚举

`arxivDataStatus` 字段支持以下值：

- **`pending`**: 待获取 arXiv 详细信息 - 论文已添加到数据库，但尚未开始获取 arXiv 详细信息
- **`processing`**: 正在获取 arXiv 详细信息 - 正在从 arXiv API 获取论文详细信息
- **`completed`**: arXiv 详细信息已获取 - 论文详细信息已成功获取并保存
- **`failed`**: arXiv 详细信息获取失败 - 获取 arXiv 详细信息过程中出现错误

`referencesStatus` 字段支持以下值：

- **`pending`**: 待获取引用文献 - 论文已添加到数据库，但尚未开始获取引用文献
- **`processing`**: 正在获取引用文献 - 正在从 Semantic Scholar API 获取引用文献
- **`completed`**: 引用文献已获取 - 引用文献已成功获取并保存
- **`failed`**: 引用文献获取失败 - 获取引用文献过程中出现错误

`citationsStatus` 字段支持以下值：

- **`pending`**: 待获取被引用情况 - 论文已添加到数据库，但尚未开始获取被引用情况
- **`processing`**: 正在获取被引用情况 - 正在从 Semantic Scholar API 获取被引用情况
- **`completed`**: 被引用情况已获取 - 被引用情况已成功获取并保存
- **`failed`**: 被引用情况获取失败 - 获取被引用情况过程中出现错误

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

### 2. 作者信息存储

存储论文作者的详细信息：
- 作者姓名
- 作者所属机构
- 与论文的关联关系

### 3. 分类信息存储

存储论文的分类信息：
- 主分类
- 所有分类
- 与论文的关联关系

### 4. 处理状态追踪

追踪每篇论文的处理进度：
- 避免重复处理同一篇论文
- 支持断点续传（从失败或未完成的状态继续）
- 记录处理时间

### 5. 引用文献获取状态追踪

追踪每篇论文的引用文献获取进度：
- `referencesStatus`: 标记引用文献的获取状态（`pending`、`processing`、`completed`、`failed`）
- `referencesFetchedAt`: 记录最后一次成功获取引用文献的时间戳
- 避免重复获取同一篇论文的引用文献
- 支持批量获取未获取引用文献的论文
- 相关脚本：
  - [fetch-reference](../scripts/semantic-scholar/fetch-reference.md) - 获取单篇论文的引用文献
  - [fetch-references](../scripts/semantic-scholar/fetch-references.md) - 批量获取未获取引用文献的论文

### 6. 被引用情况获取状态追踪

追踪每篇论文的被引用情况获取进度：
- `citationsStatus`: 标记被引用情况的获取状态（`pending`、`processing`、`completed`、`failed`）
- `citationsFetchedAt`: 记录最后一次成功获取被引用情况的时间戳
- 避免重复获取同一篇论文的被引用情况
- 支持批量获取未获取被引用情况的论文
- 相关脚本：
  - [fetch-citation](../scripts/semantic-scholar/fetch-citation.md) - 获取单篇论文的被引用情况
  - [fetch-citations](../scripts/semantic-scholar/fetch-citations.md) - 批量获取未获取被引用情况的论文

## 相关文档

- [Semantic Scholar 数据表说明](./semantic-scholar.md)
- [引用关系表说明](./reference.md)
- [数据库总览](./README.md)
- [状态机设计](./state-machine.md)
- [API 集成](./api-integration.md)
