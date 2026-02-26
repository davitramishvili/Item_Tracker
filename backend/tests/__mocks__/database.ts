// Mock database module - prevents real DB connections during testing
export const promisePool = {
  query: jest.fn(),
  getConnection: jest.fn(),
};
