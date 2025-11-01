const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD) || 1;

/**
 * GET /api/notifications/low-stock
 * Récupérer les badges avec stock faible (≤ 1)
 */
router.get('/low-stock', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM badges WHERE stock <= 1 ORDER BY stock ASC, nom ASC'
    );

    res.json({
      count: result.rows.length,
      badges: result.rows
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * GET /api/notifications/count
 * Récupérer uniquement le nombre de badges en stock faible
 */
router.get('/count', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM badges WHERE stock <= 1'
    );

    res.json({
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * GET /api/notifications/out-of-stock
 * Récupérer les badges complètement en rupture de stock (stock = 0)
 */
router.get('/out-of-stock', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM badges WHERE stock = 0 ORDER BY nom ASC'
    );

    res.json({
      count: result.rows.length,
      badges: result.rows
    });
  } catch (error) {
    console.error('Erreur récupération ruptures de stock:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * GET /api/notifications/all
 * Récupérer toutes les notifications (stock faible + autres alertes)
 */
router.get('/all', verifyToken, async (req, res) => {
  try {
    // Badges avec stock faible
    const lowStockResult = await query(
      'SELECT * FROM badges WHERE stock = 1 ORDER BY nom ASC'
    );

    // Badges en rupture de stock
    const outOfStockResult = await query(
      'SELECT * FROM badges WHERE stock = 0 ORDER BY nom ASC'
    );

    res.json({
      lowStock: {
        count: lowStockResult.rows.length,
        badges: lowStockResult.rows
      },
      outOfStock: {
        count: outOfStockResult.rows.length,
        badges: outOfStockResult.rows
      },
      totalNotifications: lowStockResult.rows.length + outOfStockResult.rows.length
    });
  } catch (error) {
    console.error('Erreur récupération notifications complètes:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

module.exports = router;