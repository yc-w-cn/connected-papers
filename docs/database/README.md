# 数据库文档

本目录包含数据库相关的文档，按数据源和功能模块组织。

## 文档结构

- [arxiv.md](./arxiv.md) - arXiv 相关数据表说明
- [semantic-scholar.md](./semantic-scholar.md) - Semantic Scholar 相关数据表说明
- [reference.md](./reference.md) - 引用关系表说明
- [network-request.md](./network-request.md) - NetworkRequest 表详细说明
- [state-machine.md](./state-machine.md) - 论文处理状态机设计
- [api-integration.md](./api-integration.md) - 外部 API 集成说明

## 数据库配置

- **数据库类型**: SQLite
- **数据库文件**: `prisma/dev.db`
- **Prisma Schema**: `prisma/schema.prisma`

## 数据模型概览

### ArxivPaper 模型
存储 arXiv 论文的基本信息和处理状态。

### SemanticScholarPaper 模型
存储从 Semantic Scholar API 获取的论文数据。

### Reference 模型
维护论文之间的引用关系。

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
