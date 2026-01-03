# fetch-papers 使用说明

## 概述

`fetch-papers` 脚本用于批量获取所有待处理的 arXiv 论文的详细信息，从 arXiv API 获取论文元数据并存储到数据库中。

## 功能特性

- 支持批量获取所有待处理的论文
- 按创建时间升序排列处理
- 自动处理状态管理（pending → processing → completed/failed）
- 详细的处理日志输出
- 错误处理和状态回滚
- 单篇失败不影响其他论文

## 使用方法

### 基本用法

```bash
pnpm run fetch-papers
```

## 使用示例

### 示例 1：处理所有待处理论文

```bash
pnpm run fetch-papers
```

**输出示例**：
```
============================================================
开始批量获取论文 arXiv 数据...
============================================================
找到 3 篇待获取 arXiv 数据的论文
============================================================

[1/3] 获取论文 arXiv 数据: 2503.15888
------------------------------------------------------------
更新状态为: processing
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15888
  [1/3] 成功获取响应，响应长度: 12345 字符
  [2/3] 正在解析 XML 数据...
  [2/3] XML 解析完成
  [3/3] 正在提取论文信息...
  [3/3] 提取完成:
      标题: 论文标题
      作者: 作者1, 作者2
      发布日期: 2025-03-25
      主分类: cs.AI
      所有分类: cs.AI, cs.LG
      许可证: http://creativecommons.org/licenses/by/4.0/
      DOI: 10.1234/example.doi
保存论文数据到数据库...
保存作者信息...
保存分类信息...
论文 arXiv 数据获取完成: 2503.15888
------------------------------------------------------------

[2/3] 获取论文 arXiv 数据: 2503.15889
------------------------------------------------------------
更新状态为: processing
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15889
  [1/3] 成功获取响应，响应长度: 9876 字符
  [2/3] 正在解析 XML 数据...
  [2/3] XML 解析完成
  [3/3] 正在提取论文信息...
  [3/3] 提取完成:
      标题: 论文标题2
      作者: 作者3
      发布日期: 2025-03-26
      主分类: cs.CV
      所有分类: cs.CV
      许可证: 无
      DOI: 无
保存论文数据到数据库...
保存作者信息...
保存分类信息...
论文 arXiv 数据获取完成: 2503.15889
------------------------------------------------------------

[3/3] 获取论文 arXiv 数据: 2503.15890
------------------------------------------------------------
更新状态为: processing
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15890
论文 arXiv 数据获取失败: 2503.15890 Error: arXiv API 请求失败: 404 Not Found
状态已更新为: failed
------------------------------------------------------------

============================================================
所有论文 arXiv 数据获取完成
============================================================
```

### 示例 2：没有待处理论文

```bash
pnpm run fetch-papers
```

**输出示例**：
```
============================================================
开始批量获取论文 arXiv 数据...
============================================================
没有待获取 arXiv 数据的论文
```

## 处理流程

### 1. 查找待处理论文

```typescript
// 查询所有 arxivDataStatus 为 pending 的论文，按创建时间升序排列
const pendingPapers = await prisma.arxivPaper.findMany({
  where: { arxivDataStatus: 'pending' },
  orderBy: { createdAt: 'asc' }
});
```

### 2. 逐篇处理论文

对每篇待处理论文执行以下操作：

#### 步骤 1: 更新状态为处理中
```typescript
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { arxivDataStatus: 'processing' }
});
```

#### 步骤 2: 从 arXiv API 获取论文数据
```typescript
// 使用 arXiv API 获取论文元数据
const response = await fetch(`https://export.arxiv.org/api/query?id_list=${arxivId}`);
```

#### 步骤 3: 解析 XML 响应
- 解析 arXiv API 返回的 XML 数据
- 提取以下字段：
  - `title`: 论文标题
  - `summary`: 论文摘要
  - `authors`: 作者列表（包含姓名和机构）
  - `published`: 发布日期
  - `primary_category`: 主分类
  - `categories`: 所有分类
  - `license`: 许可证
  - `updated`: arXiv 更新时间
  - `comment`: 评论
  - `journal_ref`: 期刊引用
  - `doi`: DOI

#### 步骤 4: 更新数据库记录
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

#### 步骤 5: 保存作者信息
```typescript
for (const author of arxivData.authors) {
  await prisma.arxivAuthorName.create({
    data: {
      name: author.name,
      affiliation: author.affiliation,
      arxivPaperId: paper.id,
    },
  });
}
```

#### 步骤 6: 保存分类信息
```typescript
for (const category of arxivData.categories) {
  await prisma.arxivCategory.create({
    data: {
      category,
      arxivPaperId: paper.id,
    },
  });
}
```

#### 步骤 7: 错误处理
如果处理过程中出现错误：
```typescript
// 将状态更新为 failed
await prisma.arxivPaper.update({
  where: { id: paper.id },
  data: { arxivDataStatus: 'failed' }
});
```

## 状态说明

| 状态 | 说明 | 是否处理 |
|------|------|----------|
| `pending` | 待获取 arXiv 数据 | 是 |
| `processing` | 正在从 arXiv API 获取数据 | 否（跳过） |
| `completed` | arXiv 数据获取成功 | 否（跳过） |
| `failed` | arXiv 数据获取失败 | 是（重试） |

## 错误处理

### 常见错误

1. **网络错误**
   - arXiv API 无法访问
   - 请求超时
   - 解决方法：检查网络连接，稍后重试

2. **论文不存在**
   - arXiv ID 错误
   - 论文已被删除
   - 解决方法：验证 arXiv ID 是否正确

3. **XML 解析错误**
   - API 响应格式异常
   - 解决方法：检查 arXiv API 状态

4. **数据库错误**
   - 数据库连接失败
   - 解决方法：检查数据库配置，运行 `pnpm run prisma:migrate`

### 重试失败论文

如果论文获取失败，可以手动重试：

```bash
# 方法 1：使用指定论文命令
pnpm run fetch-paper {arxivId}

# 方法 2：重置状态后批量处理
# 1. 使用 Prisma Studio 将状态改为 pending
pnpm run prisma:studio

# 2. 重新运行批量处理
pnpm run fetch-papers
```

## 查看处理结果

### 使用 Prisma Studio

```bash
pnpm run prisma:studio
```

在浏览器中打开 `http://localhost:5555`，可以：
- 查看所有论文记录
- 查看 arXiv 数据获取状态
- 手动修改状态
- 查看论文元数据

## 注意事项

1. **串行处理**
   - 当前实现为串行处理，一次只处理一篇论文
   - 大量论文需要较长时间

2. **API 限制**
   - 遵守 arXiv API 使用规范
   - 避免过于频繁的请求

3. **状态管理**
   - 处理中的论文不会重复处理
   - 已完成的论文不会重复处理
   - 失败的论文可以重试

4. **数据完整性**
   - 处理失败时状态会回滚到 `failed`
   - 不会影响其他论文的处理

5. **日志输出**
   - 所有处理步骤都有详细日志
   - 错误信息会完整输出

## 性能建议

1. **批量处理**
   - 适合处理少量论文（< 100 篇）
   - 大量论文建议分批处理

2. **网络环境**
   - 确保网络连接稳定
   - 避免在网络不稳定时处理

3. **数据库维护**
   - 定期清理失败记录
   - 定期备份数据库文件

## 相关文档

- [获取单个论文 arXiv 数据](./fetch-paper.md)
- [数据库文档](../../database/README.md)
- [状态机设计](../../database/state-machine.md)
- [错误处理](../../architecture/error-handling.md)

## 相关文件

- [scripts/arxiv/fetch-papers.ts](../../scripts/arxiv/fetch-papers.ts) - 批量获取脚本主文件
- [src/lib/arxiv/fetch-paper.ts](../../src/lib/arxiv/fetch-paper.ts) - arXiv API 调用逻辑
- [prisma/schema.prisma](../../prisma/schema.prisma) - 数据库模型定义
