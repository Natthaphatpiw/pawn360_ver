// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://40.81.244.202:8000',
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      SIGNIN: '/auth/signin',
      SIGNUP: '/auth/signup'
    },
    STORES: '/stores',
    CUSTOMERS: '/customers',
    CONTRACTS: '/contracts'
  }
};

// Helper function to build full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};