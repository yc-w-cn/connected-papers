import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { XMLParser } from 'fast-xml-parser';
import { prismaMock } from '@/__mocks__/prisma-mock';
import { createMockResponse } from '@/__mocks__/fetch-mock';
import { fetchArxivPaper } from './fetch-paper';

jest.mock('../prisma', () => ({
  prisma: prismaMock,
}));
jest.mock('fast-xml-parser');
jest.mock('../network-request', () => ({
  recordNetworkRequest: jest.fn(),
}));

describe('fetchArxivPaper 函数', () => {
  const mockXMLParser = XMLParser as jest.MockedClass<typeof XMLParser>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该成功获取并解析 arXiv 论文数据', async () => {
    mockXMLParser.mockImplementation(() => ({
      parse: jest.fn().mockReturnValue({
        feed: {
          entry: {
            title: 'Test Paper',
            summary: 'Test abstract',
            published: '2024-01-01T00:00:00Z',
            updated: '2024-01-02T00:00:00Z',
            author: { name: 'Author 1' },
            category: { '@_term': 'cs.AI' },
            'arxiv:primary_category': { '@_term': 'cs.AI' },
          },
        },
      }),
    }) as any);

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(
      createMockResponse(
        true,
        200,
        '<feed><entry><title>Test Paper</title><summary>Test abstract</summary><published>2024-01-01T00:00:00Z</published><updated>2024-01-02T00:00:00Z</updated><author><name>Author 1</name></author><category term="cs.AI"></category><arxiv:primary_category term="cs.AI"></arxiv:primary_category></entry></feed>',
      ),
    );

    const result = await fetchArxivPaper('2401.00001');

    expect(result).toEqual({
      title: 'Test Paper',
      abstract: 'Test abstract',
      authors: [{ name: 'Author 1' }],
      publishedDate: '2024-01-01',
      primaryCategory: 'cs.AI',
      categories: ['cs.AI'],
      updatedAtArxiv: '2024-01-02',
    });
  });

  it('应该抛出错误当未找到论文数据', async () => {
    mockXMLParser.mockImplementation(() => ({
      parse: jest.fn().mockReturnValue({ feed: {} }),
    }) as any);

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(
      createMockResponse(true, 200, '<feed></feed>'),
    );

    await expect(fetchArxivPaper('2401.00001')).rejects.toThrow('未找到论文数据');
  });

  it('应该正确处理多个作者', async () => {
    mockXMLParser.mockImplementation(() => ({
      parse: jest.fn().mockReturnValue({
        feed: {
          entry: {
            title: 'Test Paper',
            summary: 'Test abstract',
            published: '2024-01-01T00:00:00Z',
            author: [
              { name: 'Author 1' },
              { name: 'Author 2' },
            ],
          },
        },
      }),
    }) as any);

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(
      createMockResponse(
        true,
        200,
        '<feed><entry><title>Test Paper</title><summary>Test abstract</summary><published>2024-01-01T00:00:00Z</published><author><name>Author 1</name></author><author><name>Author 2</name></author></entry></feed>',
      ),
    );

    const result = await fetchArxivPaper('2401.00001');

    expect(result.authors).toHaveLength(2);
    expect(result.authors[0].name).toBe('Author 1');
    expect(result.authors[1].name).toBe('Author 2');
  });

  it('应该正确处理多个分类', async () => {
    mockXMLParser.mockImplementation(() => ({
      parse: jest.fn().mockReturnValue({
        feed: {
          entry: {
            title: 'Test Paper',
            summary: 'Test abstract',
            published: '2024-01-01T00:00:00Z',
            category: [
              { '@_term': 'cs.AI' },
              { '@_term': 'cs.LG' },
            ],
          },
        },
      }),
    }) as any);

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(
      createMockResponse(
        true,
        200,
        '<feed><entry><title>Test Paper</title><summary>Test abstract</summary><published>2024-01-01T00:00:00Z</published><category term="cs.AI"></category><category term="cs.LG"></category></entry></feed>',
      ),
    );

    const result = await fetchArxivPaper('2401.00001');

    expect(result.categories).toEqual(['cs.AI', 'cs.LG']);
  });

  it('应该正确处理作者机构信息', async () => {
    mockXMLParser.mockImplementation(() => ({
      parse: jest.fn().mockReturnValue({
        feed: {
          entry: {
            title: 'Test Paper',
            summary: 'Test abstract',
            published: '2024-01-01T00:00:00Z',
            author: {
              name: 'Author 1',
              'arxiv:affiliation': 'Test University',
            },
          },
        },
      }),
    }) as any);

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(
      createMockResponse(
        true,
        200,
        '<feed><entry><title>Test Paper</title><summary>Test abstract</summary><published>2024-01-01T00:00:00Z</published><author><name>Author 1</name><arxiv:affiliation>Test University</arxiv:affiliation></author></entry></feed>',
      ),
    );

    const result = await fetchArxivPaper('2401.00001');

    expect(result.authors[0].affiliation).toBe('Test University');
  });

  it('应该正确处理可选字段', async () => {
    mockXMLParser.mockImplementation(() => ({
      parse: jest.fn().mockReturnValue({
        feed: {
          entry: {
            title: 'Test Paper',
            summary: 'Test abstract',
            published: '2024-01-01T00:00:00Z',
            license: 'test license',
            comment: 'test comment',
            'arxiv:journal_ref': 'Test Journal',
            'arxiv:doi': '10.1234/test',
          },
        },
      }),
    }) as any);

    const { recordNetworkRequest } = require('../network-request');
    recordNetworkRequest.mockResolvedValue(
      createMockResponse(
        true,
        200,
        '<feed><entry><title>Test Paper</title><summary>Test abstract</summary><published>2024-01-01T00:00:00Z</published><license>test license</license><comment>test comment</comment><arxiv:journal_ref>Test Journal</arxiv:journal_ref><arxiv:doi>10.1234/test</arxiv:doi></entry></feed>',
      ),
    );

    const result = await fetchArxivPaper('2401.00001');

    expect(result.license).toBe('test license');
    expect(result.comment).toBe('test comment');
    expect(result.journalRef).toBe('Test Journal');
    expect(result.doi).toBe('10.1234/test');
  });
});
