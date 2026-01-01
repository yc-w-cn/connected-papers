# Semantic Scholar 数据表说明

## 概述

Semantic Scholar 相关数据表用于存储从 Semantic Scholar API 获取的论文数据。

## 数据模型

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

## 使用场景

### 1. Semantic Scholar 数据存储

存储从 Semantic Scholar API 获取的论文数据，包括：
- Semantic Scholar 论文 ID 和 URL
- 引用统计（citationCount、influentialCitationCount）
- 开放访问 PDF 链接
- 发表类型
- 作者信息（含 Semantic Scholar 作者 ID）
- 研究领域（s2FieldsOfStudy）
- 发表场所信息（venue、volume、issue、pages）

### 2. 作者信息存储

存储论文作者的详细信息：
- 作者姓名
- Semantic Scholar 作者 ID
- 与论文的关联关系

### 3. 分类信息存储

存储论文的研究领域信息：
- 研究领域名称
- 研究领域分类
- 与论文的关联关系

### 4. 发表场所信息存储

存储论文的发表场所信息：
- 发表场所（会议/期刊名称）
- 卷号
- 期号
- 页码

## 关系说明

- `SemanticScholarPaper` 与 `ArxivPaper` 是一对一关系
- `SemanticScholarPaper` 可以有多位作者（`authors`）
- `SemanticScholarPaper` 可以有多个研究领域（`fieldsOfStudy`）
- `SemanticScholarPaper` 可以有一个发表场所信息（`venue`）

## 相关文档

- [Arxiv 数据表说明](./arxiv.md)
- [引用关系表说明](./reference.md)
- [数据库总览](./README.md)
