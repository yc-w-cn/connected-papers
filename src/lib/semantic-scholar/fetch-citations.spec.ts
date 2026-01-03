import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '@/__mocks__/prisma-mock';
import { createMockResponse } from '@/__mocks__/fetch-mock';

jest.mock('../prisma', () => ({
  prisma: prismaMock,
}));
jest.mock('../network-request', () => ({
  recordNetworkRequest: jest.fn(),
}));

import { fetchArxivCitations } from './fetch-citations';

describe('fetchArxivCitations 函数', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该成功获取 arXiv 被引用情况', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      {
        citations: [
          {
            externalIds: { ArXiv: '2401.00002' },
            title: 'Citation Paper 1',
            authors: [{ name: 'Author 1' }],
            year: 2023,
            paperId: 'paper-1',
            url: 'https://example.com/paper1',
            citationCount: 5,
            influentialCitationCount: 3,
            openAccessPdf: { url: 'https://example.com/pdf1' },
            publicationTypes: ['JournalArticle'],
            s2FieldsOfStudy: [{ field: 'AI', category: 'CS' }],
            venue: 'Journal 1',
            volume: '1',
            issue: '1',
            pages: '1-10',
          },
        ],
      },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result).toHaveLength(1);
    expect(result[0].arxivId).toBe('2401.00002');
    expect(result[0].title).toBe('Citation Paper 1');
  });

  it('应该返回空数组当没有被引用情况', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      { citations: [] },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result).toEqual([]);
  });

  it('应该只包含有 arXiv ID 的被引用', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      {
        citations: [
          {
            externalIds: { ArXiv: '2401.00002' },
            title: 'ArXiv Paper',
          },
          {
            externalIds: { DOI: '10.1234/test' },
            title: 'Non-ArXiv Paper',
          },
        ],
      },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result).toHaveLength(1);
    expect(result[0].arxivId).toBe('2401.00002');
  });

  it('应该正确处理多个作者', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      {
        citations: [
          {
            externalIds: { ArXiv: '2401.00002' },
            title: 'Paper',
            authors: [
              { name: 'Author 1' },
              { name: 'Author 2' },
              { name: 'Author 3' },
            ],
          },
        ],
      },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result[0].authors).toBe('Author 1, Author 2, Author 3');
    expect(result[0].authorDetails).toHaveLength(3);
  });

  it('应该正确处理可选字段', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      {
        citations: [
          {
            externalIds: { ArXiv: '2401.00002' },
            title: 'Paper',
          },
        ],
      },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result[0].authors).toBeUndefined();
    expect(result[0].publishedDate).toBeUndefined();
    expect(result[0].citationCount).toBeUndefined();
  });

  it('应该正确处理作者详细信息', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      {
        citations: [
          {
            externalIds: { ArXiv: '2401.00002' },
            title: 'Paper',
            authors: [
              { authorId: 'author-1', name: 'Author 1' },
              { authorId: 'author-2', name: 'Author 2' },
            ],
          },
        ],
      },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result[0].authorDetails).toEqual([
      { authorId: 'author-1', name: 'Author 1' },
      { authorId: 'author-2', name: 'Author 2' },
    ]);
  });

  it('应该正确处理发表日期', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      {
        citations: [
          {
            externalIds: { ArXiv: '2401.00002' },
            title: 'Paper',
            year: 2023,
          },
        ],
      },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result[0].publishedDate).toBe('2023-01-01');
  });

  it('应该正确处理多个研究领域', async () => {
    const mockResponse = createMockResponse(
      true,
      200,
      '',
      {
        citations: [
          {
            externalIds: { ArXiv: '2401.00002' },
            title: 'Paper',
            s2FieldsOfStudy: [
              { field: 'AI', category: 'CS' },
              { field: 'ML', category: 'CS' },
            ],
          },
        ],
      },
    );

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(mockResponse);

    const result = await fetchArxivCitations('2401.00001');

    expect(result[0].s2FieldsOfStudy).toEqual([
      { field: 'AI', category: 'CS' },
      { field: 'ML', category: 'CS' },
    ]);
  });
});
