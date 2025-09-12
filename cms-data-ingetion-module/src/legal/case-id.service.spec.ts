import { Test, TestingModule } from '@nestjs/testing';
import { CaseIdService } from './case-id.service';
import { CaseIdGenerationRequestDto } from './dto/case-id-generation.dto';

// Mock Drizzle ORM
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
};

describe('CaseIdService', () => {
  let service: CaseIdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaseIdService,
        {
          provide: 'DRIZZLE',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<CaseIdService>(CaseIdService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCaseId', () => {
    it('should generate case ID with prefix, date, category, and sequence', async () => {
      const request: CaseIdGenerationRequestDto = {
        prefix: 'LC',
        categoryCode: 'CIV',
        createdBy: 'test_user',
      };

      // Mock the sequence lookup
      mockDb.where.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      // Mock the insert
      mockDb.returning.mockResolvedValueOnce([
        {
          counterId: 'Case ID-CIV-LC-20250127',
          sequenceNumber: 1,
        },
      ]);

      // Mock the update
      mockDb.where.mockReturnValueOnce({
        set: jest.fn().mockResolvedValueOnce(undefined),
      });

      const result = await service.generateCaseId(request);

      expect(result.success).toBe(true);
      expect(result.caseId).toMatch(/^LC-\d{8}-CIV-0001$/);
      expect(result.message).toBe('Case ID generated successfully');
    });

    it('should generate case ID without category code', async () => {
      const request: CaseIdGenerationRequestDto = {
        prefix: 'LC',
        createdBy: 'test_user',
      };

      // Mock the sequence lookup
      mockDb.where.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      // Mock the insert
      mockDb.returning.mockResolvedValueOnce([
        {
          counterId: 'Case ID-LC-20250127',
          sequenceNumber: 1,
        },
      ]);

      // Mock the update
      mockDb.where.mockReturnValueOnce({
        set: jest.fn().mockResolvedValueOnce(undefined),
      });

      const result = await service.generateCaseId(request);

      expect(result.success).toBe(true);
      expect(result.caseId).toMatch(/^LC-\d{8}-0001$/);
      expect(result.message).toBe('Case ID generated successfully');
    });

    it('should return error for empty prefix', async () => {
      const request: CaseIdGenerationRequestDto = {
        prefix: '',
        createdBy: 'test_user',
      };

      const result = await service.generateCaseId(request);

      expect(result.success).toBe(false);
      expect(result.caseId).toBe('');
      expect(result.message).toBe('Prefix is required and cannot be empty');
    });

    it('should return error for missing prefix', async () => {
      const request: CaseIdGenerationRequestDto = {
        prefix: '   ',
        createdBy: 'test_user',
      };

      const result = await service.generateCaseId(request);

      expect(result.success).toBe(false);
      expect(result.caseId).toBe('');
      expect(result.message).toBe('Prefix is required and cannot be empty');
    });
  });

  describe('formatCaseId', () => {
    it('should format case ID with category code', () => {
      const result = service['formatCaseId']('LC', '20250127', 'CIV', 1);
      expect(result).toBe('LC-20250127-CIV-0001');
    });

    it('should format case ID without category code', () => {
      const result = service['formatCaseId']('LC', '20250127', undefined, 1);
      expect(result).toBe('LC-20250127-0001');
    });

    it('should pad sequence with zeros', () => {
      const result = service['formatCaseId']('LC', '20250127', 'CIV', 23);
      expect(result).toBe('LC-20250127-CIV-0023');
    });

    it('should handle large sequence numbers', () => {
      const result = service['formatCaseId']('LC', '20250127', 'CIV', 12345);
      expect(result).toBe('LC-20250127-CIV-12345');
    });
  });

  describe('getCurrentSequence', () => {
    it('should get current sequence for prefix and category', async () => {
      const mockSequence = [
        {
          counterId: 'Case ID-CIV-LC-20250127',
          prefix: 'LC',
          currentDate: '2025-01-27',
          sequenceNumber: 5,
          lastUpdated: new Date('2025-01-27T10:00:00Z'),
        },
      ];

      mockDb.where.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValueOnce(mockSequence),
      });

      const result = await service.getCurrentSequence('LC', 'CIV');

      expect(result).toEqual({
        id: 'Case ID-CIV-LC-20250127',
        prefix: 'LC',
        categoryCode: 'CIV',
        sequenceDate: '20250127',
        currentSequence: 5,
        createdAt: mockSequence[0].lastUpdated,
        updatedAt: mockSequence[0].lastUpdated,
      });
    });

    it('should return null when no sequence found', async () => {
      mockDb.where.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      const result = await service.getCurrentSequence('LC', 'CIV');

      expect(result).toBeNull();
    });
  });

  describe('isCaseIdUnique', () => {
    it('should return true for unique case ID', async () => {
      mockDb.where.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      const result = await service.isCaseIdUnique('LC-20250127-CIV-0001');

      expect(result).toBe(true);
    });

    it('should return false for existing case ID', async () => {
      mockDb.where.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValueOnce([{ caseId: 'LC-20250127-CIV-0001' }]),
      });

      const result = await service.isCaseIdUnique('LC-20250127-CIV-0001');

      expect(result).toBe(false);
    });
  });
});
