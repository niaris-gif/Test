const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gestion_badges',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
});

async function initUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initialisation des utilisateurs...');

    // Hasher les mots de passe
    const adminPassword = await bcrypt.hash('password123', 10);
    const secretairePassword = await bcrypt.hash('password123', 10);

    console.log('🔐 Mots de passe hashés');

    // Supprimer les utilisateurs existants
    await client.query('DELETE FROM users WHERE username IN ($1, $2)', ['admin', 'secretaire']);
    console.log('🗑️  Anciens utilisateurs supprimés');

    // Créer l'utilisateur admin
    const adminResult = await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      ['admin', adminPassword, 'admin']
    );
    console.log('✅ Admin créé:', adminResult.rows[0]);

    // Créer l'utilisateur secrétaire
    const secretaireResult = await client.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      ['secretaire', secretairePassword, 'secretaire']
    );
    console.log('✅ Secrétaire créé:', secretaireResult.rows[0]);

    console.log('\n✨ Utilisateurs initialisés avec succès !');
    console.log('📝 Identifiants de test:');
    console.log('   - admin / password123');
    console.log('   - secretaire / password123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
initUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });