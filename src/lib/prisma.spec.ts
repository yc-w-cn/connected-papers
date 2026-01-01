import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

jest.mock('@prisma/adapter-better-sqlite3');
jest.mock('@/generated/prisma/client');

describe('Prisma 客户端', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('应该创建 Prisma 客户端实例', () => {
    const { prisma } = require('./prisma');
    expect(prisma).toBeDefined();
    expect(prisma).toBeInstanceOf(PrismaClient);
  });

  it('应该使用单例模式', () => {
    const { prisma: prisma1 } = require('./prisma');
    const { prisma: prisma2 } = require('./prisma');
    expect(prisma1).toBe(prisma2);
  });

  it('应该使用正确的适配器配置', () => {
    require('./prisma');
    expect(PrismaBetterSqlite3).toHaveBeenCalledWith({
      url: 'file:./prisma/connected-papers.db',
    });
  });

  it('应该在非生产环境缓存 Prisma 实例', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { prisma: prisma1 } = require('./prisma');
    const { prisma: prisma2 } = require('./prisma');

    expect(prisma1).toBe(prisma2);
    expect(prisma1).toBe((global as any).prisma);

    process.env.NODE_ENV = originalEnv;
  });
});
