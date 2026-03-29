import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create a mock PrismaClient for unit tests
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Mock the Prisma module
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  PrismaClient: jest.fn(() => prismaMock),
}));

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Set test timeout
jest.setTimeout(30000);

// Suppress console errors during tests unless explicitly needed
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});