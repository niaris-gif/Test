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

// Middleware
app.use(cors({
  origin: ['http://localhost:8100', 'capacitor://localhost', 'ionic://localhost'],
  credentials: true
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

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Badges - Serveur actif' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Une erreur est survenue',
    message: err.message 
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
});