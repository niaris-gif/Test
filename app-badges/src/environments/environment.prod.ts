export const environment = {
  production: true,
  
  // ✅ URL de votre backend Render
  apiUrl: 'https://badge-ketaka-backend.onrender.com/api',
  apiBaseUrl: 'https://badge-ketaka-backend.onrender.com',
  
  // Configuration Ionic
  appVersion: '1.0.0',
  appName: 'Badge Ketaka',
  
  // Timeout des requêtes (en ms)
  httpTimeout: 30000,
  
  // Logs en production
  enableLogging: false,
  
  // Configuration Capacitor (pour mobile)
  capacitor: {
    allowedNavigationHosts: ['badge-ketaka-backend.onrender.com']
  }
};