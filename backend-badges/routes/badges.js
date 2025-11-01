const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'badge-' + uniqueSuffix + ext);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB par défaut
  }
});

/**
 * GET /api/badges
 * Récupérer tous les badges
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM badges ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération badges:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * GET /api/badges/low-stock
 * Récupérer les badges avec stock faible ((≤ 1)
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
    console.error('Erreur récupération low stock:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * GET /api/badges/:id
 * Récupérer un badge par ID
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM badges WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Badge non trouvé' 
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération badge:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * POST /api/badges
 * Créer un nouveau badge
 */
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { nom, description, stock, prix } = req.body;

    // Validation
    if (!nom || !description || stock === undefined || prix === undefined) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Nom, description, stock et prix requis' 
      });
    }

    if (parseInt(stock) < 0) {
      return res.status(400).json({ 
        error: 'Stock invalide',
        message: 'Le stock ne peut pas être négatif' 
      });
    }

    if (parseFloat(prix) <= 0) {
      return res.status(400).json({ 
        error: 'Prix invalide',
        message: 'Le prix doit être supérieur à 0' 
      });
    }

    // URL de la photo uploadée
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Insérer dans la base de données
    const result = await query(
      `INSERT INTO badges (nom, description, photo_url, stock, prix) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [nom, description, photoUrl, parseInt(stock), parseFloat(prix)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création badge:', error);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur suppression fichier:', err);
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * PUT /api/badges/:id
 * Mettre à jour un badge
 */
router.put('/:id', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, stock, prix } = req.body;

    // Vérifier que le badge existe
    const existing = await query(
      'SELECT * FROM badges WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Badge non trouvé' 
      });
    }

    // Validation
    if (stock !== undefined && parseInt(stock) < 0) {
      return res.status(400).json({ 
        error: 'Stock invalide',
        message: 'Le stock ne peut pas être négatif' 
      });
    }

    if (prix !== undefined && parseFloat(prix) <= 0) {
      return res.status(400).json({ 
        error: 'Prix invalide',
        message: 'Le prix doit être supérieur à 0' 
      });
    }

    // Construire la requête de mise à jour
    let photoUrl = existing.rows[0].photo_url;
    
    if (req.file) {
      // Supprimer l'ancienne photo si elle existe
      if (existing.rows[0].photo_url) {
        const oldPhotoPath = path.join(__dirname, '..', existing.rows[0].photo_url);
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Erreur suppression ancienne photo:', err);
        });
      }
      
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const result = await query(
      `UPDATE badges 
       SET nom = $1, description = $2, photo_url = $3, stock = $4, prix = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [
        nom || existing.rows[0].nom,
        description || existing.rows[0].description,
        photoUrl,
        stock !== undefined ? parseInt(stock) : existing.rows[0].stock,
        prix !== undefined ? parseFloat(prix) : existing.rows[0].prix,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur modification badge:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur suppression fichier:', err);
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/badges/:id
 * Supprimer un badge (admin uniquement)
 */
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le badge pour supprimer la photo
    const existing = await query(
      'SELECT * FROM badges WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Badge non trouvé' 
      });
    }

    // Supprimer la photo si elle existe
    if (existing.rows[0].photo_url) {
      const photoPath = path.join(__dirname, '..', existing.rows[0].photo_url);
      fs.unlink(photoPath, (err) => {
        if (err) console.error('Erreur suppression photo:', err);
      });
    }

    // Supprimer de la base de données
    await query('DELETE FROM badges WHERE id = $1', [id]);

    res.json({ 
      message: 'Badge supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur suppression badge:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * POST /api/badges/:id/vente
 * Enregistrer une vente (décrémenter le stock)
 */
router.post('/:id/vente', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantite } = req.body;

    if (!quantite || parseInt(quantite) <= 0) {
      return res.status(400).json({ 
        error: 'Quantité invalide',
        message: 'La quantité doit être supérieure à 0' 
      });
    }

    // Récupérer le badge
    const badgeResult = await query(
      'SELECT * FROM badges WHERE id = $1',
      [id]
    );

    if (badgeResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Badge non trouvé' 
      });
    }

    const badge = badgeResult.rows[0];

    // Vérifier le stock
    if (badge.stock < parseInt(quantite)) {
      return res.status(400).json({ 
        error: 'Stock insuffisant',
        message: `Stock disponible: ${badge.stock}` 
      });
    }

    // Décrémenter le stock
    const newStock = badge.stock - parseInt(quantite);
    
    await query(
      'UPDATE badges SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, id]
    );

    // Enregistrer la vente dans l'historique
    const prixTotal = badge.prix * parseInt(quantite);
    
    await query(
      'INSERT INTO ventes (badge_id, user_id, quantite, prix_total) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, parseInt(quantite), prixTotal]
    );

    // Retourner le badge mis à jour
    const updatedBadge = await query(
      'SELECT * FROM badges WHERE id = $1',
      [id]
    );

    res.json(updatedBadge.rows[0]);
  } catch (error) {
    console.error('Erreur enregistrement vente:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

/**
 * GET /api/badges/:id/ventes
 * Récupérer l'historique des ventes d'un badge
 */
router.get('/:id/ventes', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT v.*, u.username 
       FROM ventes v 
       JOIN users u ON v.user_id = u.id 
       WHERE v.badge_id = $1 
       ORDER BY v.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération historique ventes:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

module.exports = router;