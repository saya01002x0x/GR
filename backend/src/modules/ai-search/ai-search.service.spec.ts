import { AiSearchService } from './ai-search.service';

describe('AI Search Testing', () => {
  describe('AiSearchService', () => {
    let service: AiSearchService;
    const mockPrisma = {
      $queryRawUnsafe: jest.fn(),
      subscription: {
        findFirst: jest.fn(),
      },
    };
    const mockEmbedding = {
      getImageEmbedding: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      service = new AiSearchService(
        mockPrisma as any,
        mockEmbedding as any,
        {} as any, // recommendationsService not needed for this test
      );
    });

    it('TC14: Returns empty array and fails to find similar artworks due to low cosine similarity (blurry sketch)', async () => {
      // 1. Simulate embedding extraction for the uploaded blurry sketch
      // AI returns a valid vector, but it's a weak representation
      mockEmbedding.getImageEmbedding.mockResolvedValue(new Array(512).fill(0.1));

      // 2. Simulate pgvector cosine distance search
      // Even though query runs, the DB returns 0 rows because all distances are > 0.75 
      // (Cosine Similarity < 0.25 threshold configured in the system)
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      const mockFile = {
        buffer: Buffer.from('blurry_sketch_data'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.searchBySketch(mockFile, 20);

      // As documented in thesis: "Độ tương đồng (Cosine) thấp khi dùng ảnh phác thảo mờ -> FAIL"
      // Expected behavior: system gracefully returns empty array rather than hallucinating matches
      expect(result.artworks.length).toBe(0);
      expect(mockEmbedding.getImageEmbedding).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });
  });
});
