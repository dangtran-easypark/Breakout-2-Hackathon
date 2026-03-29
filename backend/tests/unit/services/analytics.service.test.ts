import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

import * as analyticsService from '../../../src/services/analytics.service';

describe('Analytics Service', () => {
  beforeEach(() => {
    mockReset(mockPrisma);
  });

  describe('getMonthlyAnalytics', () => {
    it('should return analytics ordered by year and month', async () => {
      // Arrange
      const mockAnalytics = [
        {
          id: 1,
          year: 2023,
          month: 1,
          sessionDuration: 120,
          pageViews: 10000,
          totalVisits: 5000,
        },
        {
          id: 2,
          year: 2023,
          month: 2,
          sessionDuration: 130,
          pageViews: 12000,
          totalVisits: 6000,
        },
        {
          id: 3,
          year: 2024,
          month: 1,
          sessionDuration: 150,
          pageViews: 15000,
          totalVisits: 8000,
        },
      ];

      mockPrisma.monthlyAnalytics.findMany.mockResolvedValue(mockAnalytics);

      // Act
      const result = await analyticsService.getMonthlyAnalytics();

      // Assert
      expect(result).toEqual(mockAnalytics);
      expect(mockPrisma.monthlyAnalytics.findMany).toHaveBeenCalledWith({
        orderBy: [
          { year: 'asc' },
          { month: 'asc' },
        ],
      });
      expect(mockPrisma.monthlyAnalytics.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no analytics data exists', async () => {
      // Arrange
      mockPrisma.monthlyAnalytics.findMany.mockResolvedValue([]);

      // Act
      const result = await analyticsService.getMonthlyAnalytics();

      // Assert
      expect(result).toEqual([]);
      expect(mockPrisma.monthlyAnalytics.findMany).toHaveBeenCalledWith({
        orderBy: [
          { year: 'asc' },
          { month: 'asc' },
        ],
      });
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      mockPrisma.monthlyAnalytics.findMany.mockRejectedValue(databaseError);

      // Mock console.error to avoid noise in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(analyticsService.getMonthlyAnalytics())
        .rejects.toThrow('Failed to fetch monthly analytics data');

      expect(mockPrisma.monthlyAnalytics.findMany).toHaveBeenCalledWith({
        orderBy: [
          { year: 'asc' },
          { month: 'asc' },
        ],
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching monthly analytics:',
        databaseError
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should handle different types of database errors', async () => {
      // Arrange
      const validationError = new Error('Invalid query parameters');
      mockPrisma.monthlyAnalytics.findMany.mockRejectedValue(validationError);

      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(analyticsService.getMonthlyAnalytics())
        .rejects.toThrow('Failed to fetch monthly analytics data');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching monthly analytics:',
        validationError
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});