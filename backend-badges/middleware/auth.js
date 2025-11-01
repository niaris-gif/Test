const jwt = require('jsonwebtoken');

/**
 * Middleware pour vérifier le token JWT
 */
const verifyToken = (req, res, next) => {
  // Récupérer le token depuis le header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      error: 'Accès refusé',
      message: 'Token manquant' 
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Ajouter les infos utilisateur à la requête
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Veuillez vous reconnecter' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Token invalide',
      message: 'Authentification échouée' 
    });
  }
};

/**
 * Middleware pour vérifier le rôle admin
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Accès refusé',
      message: 'Droits administrateur requis' 
    });
  }
  next();
};

/**
 * Middleware optionnel - ne bloque pas si pas de token
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // On ignore l'erreur et on continue sans user
      console.log('Token invalide mais requête autorisée');
    }
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  optionalAuth
};