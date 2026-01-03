import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '@/__mocks__/prisma-mock';

jest.mock('../prisma', () => ({
  prisma: prismaMock,
}));
jest.mock('../network-request', () => ({
  recordNetworkRequest: jest.fn(),
}));

import { saveCitationSemanticScholarData, createCitationRelation } from './save-citation';

describe('被引用数据保存模块', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveCitationSemanticScholarData', () => {
    it('应该跳过保存当没有 paperId', async () => {
      const mockCit = {
        paperId: undefined,
      } as any;

      await saveCitationSemanticScholarData('2401.00001', mockCit);

      expect(prismaMock.semanticScholarPaper.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.semanticScholarPaper.create).not.toHaveBeenCalled();
    });

    it('应该保存 Semantic Scholar 论文数据', async () => {
      const mockCit = {
        paperId: 'test-paper-id',
        url: 'https://example.com/paper',
        citationCount: 10,
        influentialCitationCount: 5,
        openAccessPdfUrl: 'https://example.com/pdf',
        publicationTypes: 'JournalArticle',
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveCitationSemanticScholarData('2401.00001', mockCit);

      expect(prismaMock.semanticScholarPaper.create).toHaveBeenCalledWith({
        data: {
          paperId: mockCit.paperId,
          url: mockCit.url,
          citationCount: mockCit.citationCount,
          influentialCitationCount: mockCit.influentialCitationCount,
          openAccessPdfUrl: mockCit.openAccessPdfUrl,
          publicationTypes: mockCit.publicationTypes,
          arxivPaperId: '2401.00001',
        },
      });
    });

    it('应该跳过已存在的论文', async () => {
      const mockCit = {
        paperId: 'test-paper-id',
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue({ id: '1' } as any);

      await saveCitationSemanticScholarData('2401.00001', mockCit);

      expect(prismaMock.semanticScholarPaper.create).not.toHaveBeenCalled();
    });

    it('应该保存作者信息', async () => {
      const mockCit = {
        paperId: 'test-paper-id',
        authorDetails: [
          { authorId: 'author-1', name: 'Author 1' },
          { authorId: 'author-2', name: 'Author 2' },
        ],
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveCitationSemanticScholarData('2401.00001', mockCit);

      expect(prismaMock.semanticScholarAuthor.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.semanticScholarAuthor.create).toHaveBeenCalledWith({
        data: {
          authorId: 'author-1',
          name: 'Author 1',
          arxivPaperId: '2401.00001',
        },
      });
    });

    it('应该保存研究领域信息', async () => {
      const mockCit = {
        paperId: 'test-paper-id',
        s2FieldsOfStudy: [
          { field: 'Artificial Intelligence', category: 'Computer Science' },
          { field: 'Machine Learning', category: 'Computer Science' },
        ],
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveCitationSemanticScholarData('2401.00001', mockCit);

      expect(prismaMock.semanticScholarFieldOfStudy.create).toHaveBeenCalledTimes(2);
    });

    it('应该保存发表场所信息', async () => {
      const mockCit = {
        paperId: 'test-paper-id',
        venue: 'Test Journal',
        volume: '1',
        issue: '1',
        pages: '1-10',
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveCitationSemanticScholarData('2401.00001', mockCit);

      expect(prismaMock.semanticScholarVenue.create).toHaveBeenCalledWith({
        data: {
          venue: 'Test Journal',
          volume: '1',
          issue: '1',
          pages: '1-10',
          arxivPaperId: '2401.00001',
        },
      });
    });
  });

  describe('createCitationRelation', () => {
    it('应该创建被引用关系', async () => {
      prismaMock.reference.findUnique.mockResolvedValue(null);
      prismaMock.reference.create.mockResolvedValue({ id: '1' } as any);

      const result = await createCitationRelation('paper-1', 'paper-2');

      expect(result).toBe(true);
      expect(prismaMock.reference.create).toHaveBeenCalledWith({
        data: {
          paperId: 'paper-1',
          referenceId: 'paper-2',
        },
      });
    });

    it('应该跳过已存在的被引用关系', async () => {
      prismaMock.reference.findUnique.mockResolvedValue({ id: '1' } as any);

      const result = await createCitationRelation('paper-1', 'paper-2');

      expect(result).toBe(false);
      expect(prismaMock.reference.create).not.toHaveBeenCalled();
    });
  });
});
