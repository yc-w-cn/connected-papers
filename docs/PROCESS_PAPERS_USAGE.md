# process-papers 使用说明

## 概述

`process-papers` 脚本用于处理 arXiv 论文数据，从 arXiv API 获取论文元数据并存储到数据库中。

## 功能特性

- 支持批量处理所有待处理的论文
- 支持指定单个论文进行处理
- 自动处理状态管理（pending → processing → completed/failed）
- 详细的处理日志输出
- 错误处理和状态回滚

## 前置条件

在使用 `process-papers` 脚本之前，需要完成以下步骤：

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

## 使用方式

### 方式一：处理所有待处理的论文

处理数据库中所有状态为 `pending` 的论文。

```bash
pnpm run process-papers
```

**说明**：
- 查找所有状态为 `pending` 的论文
- 按创建时间升序排列
- 逐篇处理每篇论文
- 处理完成后状态更新为 `completed` 或 `failed`

### 方式二：处理指定论文

处理指定的 arXiv 论文，如果论文不存在则自动创建。

```bash
pnpm run process-paper {arxivId}
```

**参数说明**：
- `{arxivId}`: arXiv 论文 ID，例如 `2503.15888`

**说明**：
- 如果论文不存在，自动创建并处理
- 如果论文已存在且状态为 `pending` 或 `failed`，开始处理
- 如果论文状态为 `processing` 或 `completed`，跳过处理

## 使用示例

### 示例 1：处理所有待处理论文

```bash
pnpm run process-papers
```

**输出示例**：
```
开始处理待处理的论文...
找到 3 篇待处理的论文

正在处理论文: 2503.15888
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15888
  [1/3] 成功获取响应，响应长度: 12345 字符
  [2/3] 正在解析 XML 数据...
  [2/3] XML 解析完成
  [3/3] 正在保存数据到数据库...
  [3/3] 数据保存成功
论文处理完成: 2503.15888

正在处理论文: 2503.15889
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15889
  [1/3] 成功获取响应，响应长度: 9876 字符
  [2/3] 正在解析 XML 数据...
  [2/3] XML 解析完成
  [3/3] 正在保存数据到数据库...
  [3/3] 数据保存成功
论文处理完成: 2503.15889

正在处理论文: 2503.15890
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15890
论文处理失败: 2503.15890 Error: arXiv API 请求失败: 404 Not Found

所有论文处理完成
```

### 示例 2：处理指定论文

```bash
pnpm run process-paper 2503.15888
```

**输出示例**：
```
正在处理指定论文: 2503.15888
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15888
  [1/3] 成功获取响应，响应长度: 12345 字符
  [2/3] 正在解析 XML 数据...
  [2/3] XML 解析完成
  [3/3] 正在保存数据到数据库...
  [3/3] 数据保存成功
论文处理完成: 2503.15888
```

### 示例 3：处理不存在的论文（自动创建）

```bash
pnpm run process-paper 2503.15891
```

**输出示例**：
```
正在处理指定论文: 2503.15891
论文不存在，正在创建...
  [1/3] 正在从 arXiv API 获取论文数据...
  [1/3] 请求 URL: https://export.arxiv.org/api/query?id_list=2503.15891
  [1/3] 成功获取响应，响应长度: 11234 字符
  [2/3] 正在解析 XML 数据...
  [2/3] XML 解析完成
  [3/3] 正在保存数据到数据库...
  [3/3] 数据保存成功
论文处理完成: 2503.15891
```

## 处理流程

### 1. 查找论文

**批量处理模式**：
- 查询所有状态为 `pending` 的论文
- 按创建时间升序排列

**指定论文模式**：
- 根据 arxivId 查找论文
- 如果不存在，创建新记录

### 2. 更新状态为处理中

```typescript
await prisma.paper.update({
  where: { id: paper.id },
  data: { status: 'processing' }
});
```

### 3. 获取论文数据

从 arXiv API 获取论文元数据：
- 标题
- 作者
- 摘要
- 发布日期

### 4. 解析并保存数据

解析 XML 响应并更新数据库记录。

### 5. 更新状态

- 成功：`completed`
- 失败：`failed`

## 状态说明

| 状态 | 说明 | 是否处理 |
|------|------|----------|
| `pending` | 待处理 | 是 |
| `processing` | 处理中 | 否（跳过） |
| `completed` | 已完成 | 否（跳过） |
| `failed` | 失败 | 是（重试） |

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

如果论文处理失败，可以手动重试：

```bash
# 方法 1：使用指定论文命令
pnpm run process-paper {arxivId}

# 方法 2：重置状态后批量处理
# 1. 使用 Prisma Studio 将状态改为 pending
pnpm run prisma:studio

# 2. 重新运行批量处理
pnpm run process-papers
```

## 查看处理结果

### 使用 Prisma Studio

```bash
pnpm run prisma:studio
```

在浏览器中打开 `http://localhost:5555`，可以：
- 查看所有论文记录
- 查看处理状态
- 手动修改状态
- 查看论文元数据

### 使用数据库查询

```bash
# 查看所有论文
npx prisma db execute --stdin
```

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

- [Prisma 数据用途说明](./PRISMA_DATA_USAGE.md)
- [论文处理业务逻辑说明](./BUSINESS_LOGIC.md)

## 相关文件

- [scripts/process-papers.ts](../scripts/process-papers.ts) - 处理脚本主文件
- [prisma/schema.prisma](../prisma/schema.prisma) - 数据库模型定义
- [scripts/start.ts](../scripts/start.ts) - 初始论文配置
