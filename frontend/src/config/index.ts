// API Configuration
const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  APP_NAME: process.env.REACT_APP_NAME || 'RTRMM Moliya',
  APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  
  // API Endpoints
  endpoints: {
    auth: {
      login: '/auth/login/',
      logout: '/auth/logout/',
      refresh: '/auth/refresh/',
      me: '/auth/me/',
    },
    files: '/files/',
    users: '/users/',
    departments: '/departments/',
    permissions: '/permissions/',
  },
  
  // Vercel specific settings
  isVercel: process.env.VERCEL === '1',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;