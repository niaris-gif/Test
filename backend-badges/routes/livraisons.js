const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/livraisons
 * Récupérer toutes les livraisons avec filtres optionnels
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { statut, date_debut, date_fin } = req.query;
    
    let queryText = `
      SELECT 
        l.*,
        b.nom as badge_nom,
        b.photo_url as badge_photo,
        u.username as user_nom
      FROM livraisons l
      JOIN badges b ON l.badge_id = b.id
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (statut) {
      queryText += ` AND l.statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    if (date_debut) {
      queryText += ` AND l.created_at >= $${paramIndex}`;
      params.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      queryText += ` AND l.created_at <= $${paramIndex}`;
      params.push(date_fin);
      paramIndex++;
    }

    queryText += ' ORDER BY l.created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération livraisons:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * GET /api/livraisons/stats
 * Statistiques des livraisons
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
        COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
        COUNT(*) FILTER (WHERE statut = 'livree') as livrees,
        COUNT(*) FILTER (WHERE statut = 'annulee') as annulees,
        COALESCE(SUM(prix_total) FILTER (WHERE statut = 'livree'), 0) as revenu_total
      FROM livraisons
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur stats livraisons:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * GET /api/livraisons/:id
 * Récupérer une livraison par ID
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        l.*,
        b.nom as badge_nom,
        b.photo_url as badge_photo,
        b.description as badge_description,
        u.username as user_nom
      FROM livraisons l
      JOIN badges b ON l.badge_id = b.id
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Livraison non trouvée'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération livraison:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * POST /api/livraisons
 * Créer une nouvelle livraison
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      vente_id,
      badge_id,
      client_nom,
      client_contact,
      lieu_livraison,
      prix_badge,
      frais_livraison,
      quantite,
      notes
    } = req.body;

    // Validation
    if (!badge_id || !client_nom || !client_contact || !lieu_livraison || !prix_badge || !quantite) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Calculer le prix total
    const prixTotal = (parseFloat(prix_badge) * parseInt(quantite)) + parseFloat(frais_livraison || 0);

    // Insérer la livraison
    const result = await query(`
      INSERT INTO livraisons (
        vente_id, badge_id, user_id, client_nom, client_contact,
        lieu_livraison, prix_badge, frais_livraison, prix_total,
        quantite, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      vente_id || null,
      badge_id,
      req.user.id,
      client_nom,
      client_contact,
      lieu_livraison,
      prix_badge,
      frais_livraison || 0,
      prixTotal,
      quantite,
      notes || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création livraison:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * PUT /api/livraisons/:id/statut
 * Mettre à jour le statut d'une livraison
 */
router.put('/:id/statut', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Validation du statut
    const statutsValides = ['en_attente', 'en_cours', 'livree', 'annulee'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message: `Le statut doit être: ${statutsValides.join(', ')}`
      });
    }

    // Mettre à jour le statut
    const updateData = {
      statut,
      updated_at: new Date()
    };

    // Si le statut est "livree", enregistrer la date de livraison
    if (statut === 'livree') {
      updateData.date_livraison = new Date();
    }

    const result = await query(`
      UPDATE livraisons
      SET statut = $1,
          date_livraison = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [statut, statut === 'livree' ? new Date() : null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Livraison non trouvée'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * PUT /api/livraisons/:id
 * Mettre à jour une livraison complète
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_nom,
      client_contact,
      lieu_livraison,
      prix_badge,
      frais_livraison,
      quantite,
      notes,
      statut
    } = req.body;

    // Calculer le nouveau prix total
    const prixTotal = (parseFloat(prix_badge) * parseInt(quantite)) + parseFloat(frais_livraison || 0);

    const result = await query(`
      UPDATE livraisons
      SET client_nom = COALESCE($1, client_nom),
          client_contact = COALESCE($2, client_contact),
          lieu_livraison = COALESCE($3, lieu_livraison),
          prix_badge = COALESCE($4, prix_badge),
          frais_livraison = COALESCE($5, frais_livraison),
          prix_total = $6,
          quantite = COALESCE($7, quantite),
          notes = COALESCE($8, notes),
          statut = COALESCE($9, statut),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [
      client_nom,
      client_contact,
      lieu_livraison,
      prix_badge,
      frais_livraison,
      prixTotal,
      quantite,
      notes,
      statut,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Livraison non trouvée'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour livraison:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * PUT /api/livraisons/:id/annuler
 * Annuler une livraison et remettre le stock
 */
router.put('/:id/annuler', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la livraison
    const livraisonResult = await query(
      'SELECT * FROM livraisons WHERE id = $1',
      [id]
    );

    if (livraisonResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Livraison non trouvée'
      });
    }

    const livraison = livraisonResult.rows[0];

    // Vérifier que la livraison n'est pas déjà annulée
    if (livraison.statut === 'annulee') {
      return res.status(400).json({
        error: 'Livraison déjà annulée'
      });
    }

    // ✅ Remettre le stock du badge
    await query(
      'UPDATE badges SET stock = stock + $1 WHERE id = $2',
      [livraison.quantite, livraison.badge_id]
    );

    // Mettre à jour le statut de la livraison
    const result = await query(
      `UPDATE livraisons
       SET statut = 'annulee',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: 'Livraison annulée et stock remis',
      livraison: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur annulation livraison:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * DELETE /api/livraisons/:id
 * Supprimer une livraison
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM livraisons WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Livraison non trouvée'
      });
    }

    res.json({
      message: 'Livraison supprimée avec succès',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Erreur suppression livraison:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

module.exports = router;