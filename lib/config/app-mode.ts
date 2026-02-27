/**
 * App Mode Configuration for Web
 * Controls whether app uses mock data or real API
 */

export type AppMode = 'mock' | 'real';

// Special credentials to trigger mock mode
export const MOCK_MODE_CREDENTIALS = {
  email: 'demo@loan.com',
  password: 'demo123',
};

// Check if credentials should trigger mock mode
export const shouldUseMockMode = (email: string, password: string): boolean => {
  return email === MOCK_MODE_CREDENTIALS.email && password === MOCK_MODE_CREDENTIALS.password;
};

// Global app mode state (stored in localStorage)
export const setAppMode = (mode: AppMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('appMode', mode);
  }
};

export const getAppMode = (): AppMode => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('appMode') as AppMode) || 'real';
  }
  return 'real';
};

export const isMockMode = (): boolean => {
  return getAppMode() === 'mock';
};
