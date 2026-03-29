import '@testing-library/jest-dom';

// Mock import.meta.env
(global as any).importMetaEnv = {
  VITE_API_BASE_URL: 'http://localhost:3001/api',
  VITE_API_URL: 'http://localhost:5001',
};

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => children,
  HelmetProvider: ({ children }: any) => children,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;