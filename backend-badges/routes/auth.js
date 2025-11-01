const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔍 Tentative de connexion:', username);

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Username et password requis' 
      });
    }

    // Rechercher l'utilisateur
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

     console.log('📊 Utilisateur trouvé:', result.rows.length > 0);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Authentification échouée',
        message: 'Identifiants incorrects' 
      });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);

     console.log('🔑 Mot de passe valide:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Authentification échouée',
        message: 'Identifiants incorrects' 
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Retourner le token et les infos utilisateur (sans le mot de passe)
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * GET /api/auth/me
 * Récupérer les infos de l'utilisateur connecté
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * POST /api/auth/register (optionnel - pour créer de nouveaux utilisateurs)
 */
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Vérifier que l'utilisateur connecté est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: 'Droits administrateur requis' 
      });
    }

    // Validation
    if (!username || !password || !role) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Username, password et role requis' 
      });
    }

    if (!['admin', 'secretaire'].includes(role)) {
      return res.status(400).json({ 
        error: 'Rôle invalide',
        message: 'Le rôle doit être "admin" ou "secretaire"' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existing = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Utilisateur existant',
        message: 'Ce nom d\'utilisateur est déjà pris' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer le nouvel utilisateur
    const result = await query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, hashedPassword, role]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

module.exports = router;