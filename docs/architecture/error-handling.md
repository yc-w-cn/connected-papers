# 错误处理

## 概述

本文档详细说明了系统中的错误处理机制，包括错误类型、处理方式和重试策略。

## 错误类型

### 1. 网络错误

#### 描述

- arXiv API 无法访问
- 请求超时
- 网络连接中断

#### 处理方式

标记为 `failed`，记录错误日志。

```typescript
try {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
} catch (error) {
  console.error(`网络错误: ${error.message}`);

  // 更新状态为 failed
  await prisma.arxivPaper.update({
    where: { id: paper.id },
    data: { status: 'failed' }
  });
}
```

#### 解决方法

- 检查网络连接
- 稍后重试
- 检查 API 服务状态

### 2. 数据解析错误

#### 描述

- XML 格式错误
- 缺少必要字段
- 数据类型不匹配

#### 处理方式

标记为 `failed`，记录错误日志。

```typescript
try {
  const parser = new XMLParser();
  const result = parser.parse(xmlText);

  // 验证必要字段
  if (!result.entry || !result.entry.title) {
    throw new Error('缺少必要字段: title');
  }
} catch (error) {
  console.error(`数据解析错误: ${error.message}`);

  // 更新状态为 failed
  await prisma.arxivPaper.update({
    where: { id: paper.id },
    data: { status: 'failed' }
  });
}
```

#### 解决方法

- 检查 API 响应格式
- 验证数据完整性
- 联系 API 提供方

### 3. 数据库错误

#### 描述

- 数据库连接失败
- 数据写入失败
- 唯一约束冲突

#### 处理方式

抛出异常，终止处理流程。

```typescript
try {
  await prisma.arxivPaper.update({
    where: { id: paper.id },
    data: { status: 'processing' }
  });
} catch (error) {
  console.error(`数据库错误: ${error.message}`);
  throw error; // 重新抛出异常，终止处理
}
```

#### 解决方法

- 检查数据库配置
- 运行 `pnpm run prisma:migrate`
- 检查数据库文件权限

## 重试机制

### 当前实现

当前实现不支持自动重试，失败的论文需要手动干预。

### 手动重试流程

1. 检查错误日志
2. 修复问题（如网络连接）
3. 将状态从 `failed` 改回 `pending`
4. 重新运行处理脚本

### 重试示例

#### 方法 1：使用指定论文命令

```bash
# 直接重新运行命令
pnpm run process-paper 2503.15888
```

#### 方法 2：重置状态后批量处理

```bash
# 1. 使用 Prisma Studio 将状态改为 pending
pnpm run prisma:studio

# 2. 重新运行批量处理
pnpm run process-papers
```

#### 方法 3：使用数据库命令

```typescript
// 将状态从 failed 改回 pending
await prisma.arxivPaper.updateMany({
  where: { status: 'failed' },
  data: { status: 'pending' }
});
```

## 错误日志

### 日志格式

```typescript
console.error(`论文处理失败: ${arxivId}`);
console.error(`错误类型: ${error.name}`);
console.error(`错误信息: ${error.message}`);
console.error(`错误堆栈: ${error.stack}`);
```

### 日志示例

```
============================================================
论文处理失败: 2503.15890
============================================================
错误类型: Error
错误信息: arXiv API 请求失败: 404 Not Found
错误堆栈: Error: arXiv API 请求失败: 404 Not Found
    at fetchArxivPaper (/path/to/fetch-paper.ts:45:13)
    at processPaper (/path/to/process-paper.ts:23:11)
    at main (/path/to/process-paper.ts:67:5)
状态已更新为: failed
============================================================
```

## 错误恢复

### 单篇论文失败

单篇论文失败不会影响其他论文的处理。

```typescript
for (const paper of pendingPapers) {
  try {
    await processPaper(paper);
  } catch (error) {
    console.error(`论文 ${paper.arxivId} 处理失败: ${error.message}`);
    // 继续处理下一篇论文
  }
}
```

### 批量处理失败

如果批量处理过程中出现错误，已处理的论文状态保持不变，未处理的论文保持 `pending` 状态。

## 错误预防

### 1. 输入验证

在处理前验证输入数据的有效性。

```typescript
function validateArxivId(arxivId: string): boolean {
  const regex = /^\d{4}\.\d{4,5}(v\d+)?$/;
  return regex.test(arxivId);
}

if (!validateArxivId(arxivId)) {
  throw new Error('无效的 arXiv ID 格式');
}
```

### 2. 超时设置

为网络请求设置超时时间。

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 秒超时

try {
  const response = await fetch(apiUrl, {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('请求超时');
  }
  throw error;
}
```

### 3. 重试机制（未来扩展）

实现自动重试机制，提高系统稳定性。

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      // 等待一段时间后重试
      await delay(1000 * (i + 1));
    }
  }
}
```

## 相关文档

- [状态机设计](../database/state-machine.md) - 论文处理状态管理
- [API 集成](../database/api-integration.md) - 外部 API 使用说明
- [设计考虑](./design-considerations.md) - 性能优化和安全考虑
