const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const badgeRoutes = require('./routes/badges');
const livraisonRoutes = require('./routes/livraisons');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS dynamique
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
    'https://badge-ketaka-frontend.onrender.com',  
    'http://localhost:8100',
    'http://localhost:4200',
    'capacitor://localhost',
    'ionic://localhost'
  ];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (comme les apps mobiles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/livraisons', livraisonRoutes);
app.use('/api/notifications', notificationRoutes);

// Route de test / health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Gestion Badges - Serveur actif',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint pour Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Une erreur est survenue',
    message: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message 
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔓 CORS autorisé pour: ${allowedOrigins.join(', ')}`);
});