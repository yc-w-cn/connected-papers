# Jest 单元测试标准

## 依赖安装

在开始编写测试之前，请先安装以下依赖：

```bash
pnpm add -D jest @types/jest ts-jest @jest/globals
```

## 1. 测试环境配置

### 1.1 Jest 配置文件

在项目根目录创建 `jest.config.js`：

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    '!src/lib/**/*.d.ts',
    '!src/lib/**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
};
```

### 1.2 TypeScript 配置

确保 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

### 1.3 添加测试脚本

在 `package.json` 的 `scripts` 中添加：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 2. 测试文件规范

### 2.1 命名规范

- 测试文件必须以 `.spec.ts` 结尾
- 测试文件名与原文件名保持一致
- 测试文件放置在原文件同级目录

**示例**：
```
src/lib/
  ├── utils.ts
  ├── utils.spec.ts
  ├── prisma.ts
  ├── prisma.spec.ts
  ├── arxiv/
  │   ├── fetch-paper.ts
  │   └── fetch-paper.spec.ts
  ├── network-request/
  │   ├── save-request.ts
  │   └── save-request.spec.ts
  ├── reference/
  │   ├── save-reference.ts
  │   └── save-reference.spec.ts
  └── semantic-scholar/
      ├── fetch-references.ts
      └── fetch-references.spec.ts
```

### 2.2 文件结构

每个测试文件应包含：
- 导入必要的模块
- Mock 外部依赖
- 测试套件（describe）
- 测试用例（it/test）

## 3. 测试覆盖范围

### 3.1 测试类型

- **单元测试**：测试单个函数或模块
- **集成测试**：测试多个模块之间的交互
- **Mock 测试**：使用 mock 替代外部依赖

## 4. 测试编写规范

### 4.1 测试用例命名

- 使用中文描述测试场景
- 格式：`应该 + 预期行为 + 当 + 条件`

**示例**：
```typescript
it('应该正确合并类名', () => {
  // 测试代码
});

it('应该返回错误响应当 API 请求失败', () => {
  // 测试代码
});
```

### 4.2 测试结构

使用 `describe` 组织测试套件，`it` 或 `test` 编写测试用例：

```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('模块名称', () => {
  beforeEach(() => {
    // 每个测试前执行
  });

  afterEach(() => {
    // 每个测试后执行
  });

  it('应该执行某个功能', () => {
    // 准备数据
    const input = 'test';

    // 执行操作
    const result = someFunction(input);

    // 验证结果
    expect(result).toBe('expected');
  });
});
```

### 4.3 Mock 使用规范

#### Mock 外部模块

```typescript
import { jest } from '@jest/globals';

jest.mock('../prisma', () => ({
  prisma: {
    networkRequest: {
      create: jest.fn(),
    },
  },
}));
```

#### Mock 函数

```typescript
const mockFetch = jest.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValue({
  ok: true,
  status: 200,
  text: () => Promise.resolve('test data'),
});
```

#### 清理 Mock

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 4.4 异步测试处理

使用 `async/await` 处理异步操作：

```typescript
it('应该异步获取数据', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### 4.5 断言使用

使用 Jest 提供的断言方法：

```typescript
// 相等性断言
expect(value).toBe(expected);
expect(value).toEqual(expected);

// 真值断言
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// 数字断言
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(20);

// 字符串断言
expect(string).toMatch(/regex/);
expect(string).toContain('substring');

// 数组断言
expect(array).toHaveLength(3);
expect(array).toContain(item);

// 对象断言
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ key: 'value' });

// 异常断言
expect(() => {
  throw new Error('error');
}).toThrow('error');
```

## 5. 代码覆盖率要求

### 5.1 覆盖率目标

- **语句覆盖率**: ≥ 70%
- **分支覆盖率**: ≥ 70%
- **函数覆盖率**: ≥ 70%
- **行覆盖率**: ≥ 70%

### 5.2 查看覆盖率报告

运行以下命令生成覆盖率报告：

```bash
pnpm test:coverage
```

覆盖率报告将生成在 `coverage/` 目录下，打开 `coverage/lcov-report/index.html` 查看详细报告。

### 5.3 排除文件

以下文件不纳入覆盖率统计：
- 类型定义文件（`.d.ts`）
- 测试文件（`.spec.ts`）
- 配置文件

## 6. 测试命令

### 6.1 运行所有测试

```bash
pnpm test
```

### 6.2 监听模式运行测试

```bash
pnpm test:watch
```

### 6.3 运行特定测试文件

```bash
pnpm test src/lib/utils.spec.ts
```

### 6.4 运行匹配模式的测试

```bash
pnpm test --testNamePattern="应该正确合并类名"
```

### 6.5 生成覆盖率报告

```bash
pnpm test:coverage
```

## 7. 最佳实践

### 7.1 测试隔离

- 每个测试应该独立运行，不依赖其他测试
- 使用 `beforeEach` 和 `afterEach` 清理测试环境
- 避免使用全局变量

### 7.2 测试可读性

- 使用清晰的测试名称
- 遵循 AAA 模式（Arrange-Act-Assert）
- 添加必要的注释说明复杂逻辑

### 7.3 Mock 策略

- 优先 mock 外部依赖（API、数据库等）
- 保持 mock 简单，不要过度 mock
- 使用 `jest.clearAllMocks()` 清理 mock

### 7.4 异步测试

- 始终使用 `async/await` 处理异步操作
- 确保异步操作完成后再断言
- 使用 `jest.useFakeTimers()` 处理定时器

### 7.5 错误处理

- 测试正常情况和异常情况
- 验证错误消息的正确性
- 确保错误不会导致测试套件失败

## 8. 常见问题

### 8.1 如何测试私有方法？

Jest 无法直接测试私有方法，建议：
- 通过公共方法间接测试
- 将私有方法提取为独立的可测试模块
- 使用 `// @ts-ignore` 访问私有方法（不推荐）

### 9.2 如何 Mock 动态导入？

使用 `jest.mock()` 配合动态导入：

```typescript
jest.mock('./module', () => ({
  default: jest.fn(),
}));
```

### 9.3 如何处理环境变量？

在测试文件中设置环境变量：

```typescript
process.env.NODE_ENV = 'test';

afterEach(() => {
  delete process.env.NODE_ENV;
});
```

### 9.4 如何测试 React 组件？

对于 React 组件测试，需要安装额外的依赖：

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## 10. 参考资源

- [Jest 官方文档](https://jestjs.io/)
- [TypeScript Jest 配置](https://kulshekhar.github.io/ts-jest/)
- [Testing Library](https://testing-library.com/)
