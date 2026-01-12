import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsController } from './controllers/investments.controller';
import { InvestmentsService } from './services/investments.service';
import { InvestmentType } from './dto';

describe('InvestmentsController', () => {
  let controller: InvestmentsController;
  let service: InvestmentsService;

  const mockInvestmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPortfolio: jest.fn(),
    getAssetAllocation: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    getInvestmentStats: jest.fn(),
    getSupportedTypes: jest.fn(),
    getRebalancingRecommendations: jest.fn(),
    updateQuotes: jest.fn(),
    getInvestmentPerformance: jest.fn(),
    addTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentsController],
      providers: [
        { provide: InvestmentsService, useValue: mockInvestmentsService },
      ],
    }).compile();

    controller = module.get<InvestmentsController>(InvestmentsController);
    service = module.get<InvestmentsService>(InvestmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an investment', async () => {
      const createDto = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: InvestmentType.STOCK,
        quantity: 10,
        averagePrice: 150.00,
      };
      const req = { user: { id: 'user-123' } };
      const expectedResult = { id: 'inv-123', ...createDto };

      mockInvestmentsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, req);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto, 'user-123');
    });
  });

  describe('findAll', () => {
    it('should return all investments', async () => {
      const req = { user: { id: 'user-123' } };
      const filters = { types: [InvestmentType.STOCK] };
      const expectedResult = [{ id: 'inv-123', symbol: 'AAPL' }];

      mockInvestmentsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(req, filters);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith('user-123', filters);
    });
  });

  describe('getPortfolio', () => {
    it('should return portfolio summary', async () => {
      const req = { user: { id: 'user-123' } };
      const expectedResult = {
        totalValue: 10000,
        totalCost: 8000,
        totalGainLoss: 2000,
        totalGainLossPercent: 25,
        investments: [],
      };

      mockInvestmentsService.getPortfolio.mockResolvedValue(expectedResult);

      const result = await controller.getPortfolio(req, {});

      expect(result).toEqual(expectedResult);
      expect(service.getPortfolio).toHaveBeenCalledWith('user-123', {});
    });
  });

  describe('getSupportedTypes', () => {
    it('should return supported investment types', () => {
      const expectedTypes = Object.values(InvestmentType);
      mockInvestmentsService.getSupportedTypes.mockReturnValue(expectedTypes);

      const result = controller.getSupportedTypes();

      expect(result).toEqual(expectedTypes);
      expect(service.getSupportedTypes).toHaveBeenCalled();
    });
  });
});