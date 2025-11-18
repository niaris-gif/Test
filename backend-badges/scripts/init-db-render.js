const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// ⚠️ REMPLACEZ par votre Internal Database URL de Render
const DATABASE_URL = 'postgresql://badge_user:nsFIvcBNwQhB1MubftELSvQeUuXp0j5r@dpg-d447p53ipnbc73cqj3s0-a.oregon-postgres.render.com:5432/gestion_badges';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Création des tables...');

    // Créer les tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'secretaire')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        photo_url VARCHAR(500),
        stock INTEGER NOT NULL DEFAULT 0,
        prix DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ventes (
        id SERIAL PRIMARY KEY,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        quantite INTEGER NOT NULL,
        prix_total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS livraisons (
        id SERIAL PRIMARY KEY,
        vente_id INTEGER REFERENCES ventes(id) ON DELETE CASCADE,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_nom VARCHAR(200) NOT NULL,
        client_contact VARCHAR(100) NOT NULL,
        lieu_livraison TEXT NOT NULL,
        prix_badge DECIMAL(10,2) NOT NULL,
        frais_livraison DECIMAL(10,2) NOT NULL DEFAULT 0,
        prix_total DECIMAL(10,2) NOT NULL,
        quantite INTEGER NOT NULL,
        statut VARCHAR(50) DEFAULT 'en_attente',
        date_livraison TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tables créées');

    // Créer les utilisateurs
    const adminPassword = await bcrypt.hash('password123', 10);
    const secretairePassword = await bcrypt.hash('password123', 10);

    await client.query(`
      INSERT INTO users (username, password, role) VALUES 
      ('admin', $1, 'admin'),
      ('secretaire', $2, 'secretaire')
      ON CONFLICT (username) DO NOTHING;
    `, [adminPassword, secretairePassword]);

    console.log('✅ Utilisateurs créés');
    console.log('👤 admin / password123');
    console.log('👤 secretaire / password123');

    // Afficher les utilisateurs
    const result = await client.query('SELECT id, username, role FROM users');
    console.log('\n📋 Utilisateurs dans la DB:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();