import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

import { PrismaClient } from '@/generated/prisma/client'

export const prismaMock = mockDeep<PrismaClient>()