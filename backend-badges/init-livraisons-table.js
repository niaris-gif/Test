const { query } = require('./config/db');

async function initLivraisonsTable() {
  try {
    console.log('🔄 Création de la table livraisons...');

    await query(`
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
        statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'livree', 'annulee')),
        date_livraison TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Table livraisons créée avec succès');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_livraisons_statut ON livraisons(statut);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_livraisons_date ON livraisons(created_at);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_livraisons_user ON livraisons(user_id);
    `);

    console.log('✅ Index créés avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initLivraisonsTable();