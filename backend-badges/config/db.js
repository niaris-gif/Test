const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  // Support pour DATABASE_URL (Render, Heroku, etc.)
  connectionString: process.env.DATABASE_URL,
  
  // OU paramètres individuels (fallback)
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gestion_badges',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  
  // Configuration SSL pour la production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connecté à PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
});

const query = (text, params) => pool.query(text, params);

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🔗 Test de connexion réussi:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Échec du test de connexion:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};