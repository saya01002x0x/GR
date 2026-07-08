import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchController } from './search.controller';
import { SearchArtworkDto } from './dto/search-artwork.dto';
import { ContentRating } from '@prisma/client';

describe('Search & Filter Testing', () => {
  describe('SearchController and SearchDto Validation', () => {
    let controller: SearchController;
    const mockSearchService = {
      search: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      controller = new SearchController(mockSearchService as any);
    });

    it('TC11: validation fails when page is not an integer (page=abc)', async () => {
      // Create DTO payload explicitly simulating invalid type injection from query string
      const payload = { page: 'abc' };
      const dto = plainToInstance(SearchArtworkDto, payload, { enableImplicitConversion: true });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const pageError = errors.find((e) => e.property === 'page');
      expect(pageError).toBeDefined();
      expect(pageError?.constraints).toHaveProperty('isInt'); // Must be an integer number
    });

    it('TC12: validation fails when rating is outside allowed Enums (rating=VIOLENCE)', async () => {
      const payload = { rating: 'VIOLENCE' };
      const dto = plainToInstance(SearchArtworkDto, payload);
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const ratingError = errors.find((e) => e.property === 'rating');
      expect(ratingError).toBeDefined();
      expect(ratingError?.constraints).toHaveProperty('isEnum'); // Must be a valid enum value
    });

    it('TC13: calls Meilisearch with excludeAI=true and returns results', async () => {
      const mockResult = { hits: [{ id: 'art-1', isAI: false }], total: 1 };
      mockSearchService.search.mockResolvedValue(mockResult);

      const queryDto = new SearchArtworkDto();
      queryDto.q = 'Genshin';
      queryDto.excludeAI = true;

      const result = await controller.searchArtworks(queryDto);

      expect(mockSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'Genshin',
          excludeAI: true,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });
});
