import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '@/__mocks__/prisma-mock';
import { mockSuccessResponse, mockJsonResponse } from '@/__mocks__/fetch-mock';

jest.mock('../prisma', () => ({
  prisma: prismaMock,
}));
jest.mock('../network-request', () => ({
  recordNetworkRequest: jest.fn(),
}));

import { saveNetworkRequest, recordNetworkRequest } from './save-request';

describe('网络请求记录模块', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveNetworkRequest', () => {
    it('应该成功保存网络请求记录', async () => {
      const mockData = {
        requestUrl: 'https://example.com',
        success: true,
        source: 'arxiv' as const,
      };

      prismaMock.networkRequest.create.mockResolvedValue({
        id: '1',
        ...mockData,
        requestMethod: 'GET',
        createdAt: new Date(),
      } as any);

      const result = await saveNetworkRequest(mockData);

      expect(prismaMock.networkRequest.create).toHaveBeenCalledWith({
        data: {
          requestUrl: mockData.requestUrl,
          requestMethod: 'GET',
          success: mockData.success,
          source: mockData.source,
        },
      });
      expect(result).toBeDefined();
    });

    it('应该处理保存失败的情况', async () => {
      const mockData = {
        requestUrl: 'https://example.com',
        success: true,
        source: 'arxiv' as const,
      };

      prismaMock.networkRequest.create.mockRejectedValue(new Error('Database error'));

      await expect(saveNetworkRequest(mockData)).rejects.toThrow('Database error');
    });

    it('应该保存完整的请求信息', async () => {
      const mockData = {
        requestUrl: 'https://example.com',
        requestMethod: 'POST',
        requestBody: '{"test": "data"}',
        requestHeaders: '{"Content-Type": "application/json"}',
        responseStatus: 200,
        responseBody: '{"success": true}',
        responseHeaders: '{"Content-Type": "application/json"}',
        duration: 1000,
        success: true,
        source: 'arxiv' as const,
        arxivPaperId: '2401.00001',
      };

      prismaMock.networkRequest.create.mockResolvedValue({ id: '1' } as any);

      await saveNetworkRequest(mockData);

      expect(prismaMock.networkRequest.create).toHaveBeenCalledWith({
        data: mockData,
      });
    });
  });

  describe('recordNetworkRequest', () => {
    it('应该记录成功的请求', async () => {
      prismaMock.networkRequest.create.mockResolvedValue({ id: '1' } as any);

      const result = await recordNetworkRequest(
        'arxiv',
        'https://example.com',
        () => Promise.resolve(mockJsonResponse),
      );

      expect(result).toBe(mockJsonResponse);
      expect(prismaMock.networkRequest.create).toHaveBeenCalled();
    });

    it('应该记录失败的请求', async () => {
      const mockError = new Error('Network error');

      prismaMock.networkRequest.create.mockResolvedValue({ id: '1' } as any);

      await expect(
        recordNetworkRequest(
          'arxiv',
          'https://example.com',
          () => Promise.reject(mockError),
        ),
      ).rejects.toThrow('Network error');

      expect(prismaMock.networkRequest.create).toHaveBeenCalled();
    });

    it('应该计算请求持续时间', async () => {
      prismaMock.networkRequest.create.mockResolvedValue({ id: '1' } as any);

      await recordNetworkRequest(
        'semantic-scholar',
        'https://example.com',
        () => Promise.resolve(mockSuccessResponse),
      );

      const createCall = prismaMock.networkRequest.create.mock.calls[0];
      expect(createCall[0].data.duration).toBeGreaterThanOrEqual(0);
    });

    it('应该记录 arxivPaperId', async () => {
      prismaMock.networkRequest.create.mockResolvedValue({ id: '1' } as any);

      await recordNetworkRequest(
        'arxiv',
        'https://example.com',
        () => Promise.resolve(mockSuccessResponse),
        '2401.00001',
      );

      expect(prismaMock.networkRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          arxivPaperId: '2401.00001',
        }),
      });
    });
  });
});
