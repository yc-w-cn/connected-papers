# Connected Papers 文档

欢迎来到 Connected Papers 项目文档。本文档提供了项目的完整技术文档和使用指南。

## 文档结构

### 架构设计
- [架构设计](./architecture/) - 系统架构设计文档
  - [设计考虑](./architecture/design-considerations.md) - 系统设计原则和考虑因素
  - [错误处理](./architecture/error-handling.md) - 错误处理机制和最佳实践

### 数据库
- [数据库文档](./database/) - 数据库相关文档
  - [数据库总览](./database/README.md) - 数据库配置和模型概览
  - [arXiv 数据表](./database/arxiv.md) - ArxivPaper 模型详细说明
  - [Semantic Scholar 数据表](./database/semantic-scholar.md) - SemanticScholar 模型详细说明
  - [引用关系表](./database/reference.md) - Reference 模型详细说明
  - [网络请求表](./database/network-request.md) - NetworkRequest 模型详细说明
  - [状态机设计](./database/state-machine.md) - 论文处理状态机设计
  - [API 集成](./database/api-integration.md) - 外部 API 集成说明

### 脚本
- [脚本文档](./scripts/) - 脚本使用说明
  - [脚本总览](./scripts/README.md) - 所有脚本的使用说明和前置条件
  - [arXiv 脚本](./scripts/arxiv/) - arXiv 相关脚本
    - [process-paper](./scripts/arxiv/process-paper.md) - 处理单个 arXiv 论文
    - [process-papers](./scripts/arxiv/process-papers.md) - 批量处理所有待处理的 arXiv 论文
  - [Semantic Scholar 脚本](./scripts/semantic-scholar/) - Semantic Scholar 相关脚本
    - [fetch-reference](./scripts/semantic-scholar/fetch-reference.md) - 获取指定论文的引用文献
    - [fetch-references](./scripts/semantic-scholar/fetch-references.md) - 批量获取所有未获取引用文献的论文

### 设计规范
- [瑞士设计风格](./SWISS_DESIGN_STYLE.md) - 项目 UI 设计规范和风格指南
- [单元测试标准](./unit-testing-standard.md) - 单元测试编写规范和最佳实践

## 快速开始

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

### 3. 处理论文数据

```bash
# 处理所有待处理的论文
pnpm run process-papers

# 处理指定的论文
pnpm run process-paper <arxivId>
```

### 4. 获取引用文献

```bash
# 获取指定论文的引用文献
pnpm run fetch-reference <arxivId>

# 批量获取所有未获取引用文献的论文
pnpm run fetch-references
```

### 5. 查看数据库

```bash
# 使用 Prisma Studio 查看数据库
pnpm run prisma:studio
```

## 核心概念

### 论文处理流程

论文处理系统使用状态机来管理论文的处理流程：

1. **pending**: 论文已添加，等待处理
2. **processing**: 正在从 arXiv API 获取数据
3. **completed**: 数据获取成功，处理完成
4. **failed**: 处理过程中出现错误

详细说明请参考 [状态机设计](./database/state-machine.md)。

### 引用文献获取状态

系统还维护引用文献获取状态：

1. **referencesFetched = false**: 尚未获取引用文献
2. **referencesFetched = true**: 已获取引用文献

相关脚本：
- [fetch-reference](./scripts/semantic-scholar/fetch-reference.md) - 获取单篇论文的引用文献
- [fetch-references](./scripts/semantic-scholar/fetch-references.md) - 批量获取未获取引用文献的论文

### 数据模型

项目使用多个数据模型来存储不同来源的数据：

- **ArxivPaper**: 存储 arXiv 论文的基本信息和处理状态
- **SemanticScholarPaper**: 存储 Semantic Scholar 论文数据
- **Reference**: 维护论文之间的引用关系
- **NetworkRequest**: 记录网络请求日志

详细说明请参考 [数据库文档](./database/)。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm run prisma:generate` | 生成 Prisma Client |
| `pnpm run prisma:migrate` | 创建数据库迁移 |
| `pnpm run prisma:seed` | 运行 seed 脚本 |
| `pnpm run prisma:studio` | 打开 Prisma Studio |
| `pnpm run process-paper <arxivId>` | 处理指定的单个论文 |
| `pnpm run process-papers` | 处理所有待处理的论文 |
| `pnpm run fetch-reference <arxivId>` | 获取指定论文的引用文献 |
| `pnpm run fetch-references` | 批量获取所有未获取引用文献的论文 |

## 常见问题

### Q: 如何添加新的论文到数据库？

A: 编辑 `prisma/seed.ts` 文件，添加新的 arXiv ID，然后运行 `pnpm run prisma:seed`。

### Q: 如何查看论文的引用关系？

A: 使用 Prisma Studio 打开数据库，查看 `Reference` 表中的记录。

### Q: 如何重新获取某篇论文的引用文献？

A: 使用 Prisma Studio 或 SQL 将该论文的 `referencesFetched` 字段设置为 `false`，然后重新运行 `pnpm run fetch-reference <arxivId>`。

### Q: 论文处理失败后如何重试？

A: 使用 Prisma Studio 将论文的 `status` 字段从 `failed` 改回 `pending`，然后重新运行 `pnpm run process-papers`。

详细说明请参考 [状态机设计](./database/state-machine.md)。

## 技术栈

- **数据库**: SQLite + Prisma ORM
- **语言**: TypeScript
- **API**: arXiv API, Semantic Scholar API
- **构建工具**: Next.js
- **包管理器**: pnpm

## 贡献指南

### 代码规范

- 遵循项目现有的代码风格和命名约定
- 错误、输出、日志、注释使用中文
- 变量名使用英文
- 代码文件不超过 100 行，否则需要合理抽象

### 测试规范

- 单元测试使用 Jest
- 测试文件命名: `原文件名.spec.ts`
- 测试文件放在代码同级目录下
- 参考 [单元测试标准](./unit-testing-standard.md)

### 设计规范

- 遵循 [瑞士设计风格](./SWISS_DESIGN_STYLE.md)
- 禁止使用 emoji
- 网站强制要求静态导出

## 相关资源

- [项目仓库](https://github.com/your-org/connected-papers)
- [arXiv API 文档](https://arxiv.org/help/api/)
- [Semantic Scholar API 文档](https://api.semanticscholar.org/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发起 Pull Request
- 联系项目维护者

---

**最后更新**: 2026-01-02
