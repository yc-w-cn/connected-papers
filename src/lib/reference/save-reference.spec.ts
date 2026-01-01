import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '@/__mocks__/prisma-mock';

jest.mock('../prisma', () => ({
  prisma: prismaMock,
}));
jest.mock('../network-request', () => ({
  recordNetworkRequest: jest.fn(),
}));

import { saveSemanticScholarData, createReferenceRelation } from './save-reference';

describe('引用数据保存模块', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSemanticScholarData', () => {
    it('应该跳过保存当没有 paperId', async () => {
      const mockRef = {
        paperId: undefined,
      } as any;

      await saveSemanticScholarData('2401.00001', mockRef);

      expect(prismaMock.semanticScholarPaper.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.semanticScholarPaper.create).not.toHaveBeenCalled();
    });

    it('应该保存 Semantic Scholar 论文数据', async () => {
      const mockRef = {
        paperId: 'test-paper-id',
        url: 'https://example.com/paper',
        citationCount: 10,
        influentialCitationCount: 5,
        openAccessPdfUrl: 'https://example.com/pdf',
        publicationTypes: 'JournalArticle',
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveSemanticScholarData('2401.00001', mockRef);

      expect(prismaMock.semanticScholarPaper.create).toHaveBeenCalledWith({
        data: {
          paperId: mockRef.paperId,
          url: mockRef.url,
          citationCount: mockRef.citationCount,
          influentialCitationCount: mockRef.influentialCitationCount,
          openAccessPdfUrl: mockRef.openAccessPdfUrl,
          publicationTypes: mockRef.publicationTypes,
          arxivPaperId: '2401.00001',
        },
      });
    });

    it('应该跳过已存在的论文', async () => {
      const mockRef = {
        paperId: 'test-paper-id',
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue({ id: '1' } as any);

      await saveSemanticScholarData('2401.00001', mockRef);

      expect(prismaMock.semanticScholarPaper.create).not.toHaveBeenCalled();
    });

    it('应该保存作者信息', async () => {
      const mockRef = {
        paperId: 'test-paper-id',
        authorDetails: [
          { authorId: 'author-1', name: 'Author 1' },
          { authorId: 'author-2', name: 'Author 2' },
        ],
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveSemanticScholarData('2401.00001', mockRef);

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
      const mockRef = {
        paperId: 'test-paper-id',
        s2FieldsOfStudy: [
          { field: 'Artificial Intelligence', category: 'Computer Science' },
          { field: 'Machine Learning', category: 'Computer Science' },
        ],
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveSemanticScholarData('2401.00001', mockRef);

      expect(prismaMock.semanticScholarFieldOfStudy.create).toHaveBeenCalledTimes(2);
    });

    it('应该保存发表场所信息', async () => {
      const mockRef = {
        paperId: 'test-paper-id',
        venue: 'Test Journal',
        volume: '1',
        issue: '1',
        pages: '1-10',
      } as any;

      prismaMock.semanticScholarPaper.findUnique.mockResolvedValue(null);
      prismaMock.semanticScholarPaper.create.mockResolvedValue({ id: '1' } as any);

      await saveSemanticScholarData('2401.00001', mockRef);

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

  describe('createReferenceRelation', () => {
    it('应该创建引用关系', async () => {
      prismaMock.reference.findUnique.mockResolvedValue(null);
      prismaMock.reference.create.mockResolvedValue({ id: '1' } as any);

      const result = await createReferenceRelation('paper-1', 'paper-2');

      expect(result).toBe(true);
      expect(prismaMock.reference.create).toHaveBeenCalledWith({
        data: {
          paperId: 'paper-1',
          referenceId: 'paper-2',
        },
      });
    });

    it('应该跳过已存在的引用关系', async () => {
      prismaMock.reference.findUnique.mockResolvedValue({ id: '1' } as any);

      const result = await createReferenceRelation('paper-1', 'paper-2');

      expect(result).toBe(false);
      expect(prismaMock.reference.create).not.toHaveBeenCalled();
    });
  });
});
