-- ==========================================
-- INITIALISATION BASE DE DONNÉES
-- Badge Ketaka - Gestion des Badges
-- ==========================================

-- Extension pour UUID (optionnel)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLE: users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'secretaire')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index sur username pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ==========================================
-- TABLE: badges
-- ==========================================
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(500),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    prix DECIMAL(10,2) NOT NULL CHECK (prix > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_badges_stock ON badges(stock);
CREATE INDEX IF NOT EXISTS idx_badges_nom ON badges(nom);

-- ==========================================
-- TABLE: ventes
-- ==========================================
CREATE TABLE IF NOT EXISTS ventes (
    id SERIAL PRIMARY KEY,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_total DECIMAL(10,2) NOT NULL CHECK (prix_total > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_ventes_badge_id ON ventes(badge_id);
CREATE INDEX IF NOT EXISTS idx_ventes_user_id ON ventes(user_id);
CREATE INDEX IF NOT EXISTS idx_ventes_created_at ON ventes(created_at DESC);

-- ==========================================
-- TABLE: livraisons
-- ==========================================
CREATE TABLE IF NOT EXISTS livraisons (
    id SERIAL PRIMARY KEY,
    vente_id INTEGER REFERENCES ventes(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_nom VARCHAR(200) NOT NULL,
    client_contact VARCHAR(100) NOT NULL,
    lieu_livraison TEXT NOT NULL,
    prix_badge DECIMAL(10,2) NOT NULL CHECK (prix_badge > 0),
    frais_livraison DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (frais_livraison >= 0),
    prix_total DECIMAL(10,2) NOT NULL CHECK (prix_total > 0),
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'livree', 'annulee')),
    date_livraison TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_livraisons_statut ON livraisons(statut);
CREATE INDEX IF NOT EXISTS idx_livraisons_badge_id ON livraisons(badge_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_user_id ON livraisons(user_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_created_at ON livraisons(created_at DESC);

-- ==========================================
-- TRIGGERS: Auto-update updated_at
-- ==========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour badges
DROP TRIGGER IF EXISTS update_badges_updated_at ON badges;
CREATE TRIGGER update_badges_updated_at
    BEFORE UPDATE ON badges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour livraisons
DROP TRIGGER IF EXISTS update_livraisons_updated_at ON livraisons;
CREATE TRIGGER update_livraisons_updated_at
    BEFORE UPDATE ON livraisons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DONNÉES INITIALES
-- ==========================================

-- Insérer les utilisateurs par défaut (mot de passe: password123)
-- Hash généré avec: bcrypt.hash('password123', 10)
INSERT INTO users (username, password, role) VALUES 
    ('admin', '$2a$10$YixBaVEYiEzNt9KN8LCBmeC3pj6GVRM1BPrRkL1v2gHRN8TZhFJQG', 'admin'),
    ('secretaire', '$2a$10$YixBaVEYiEzNt9KN8LCBmeC3pj6GVRM1BPrRkL1v2gHRN8TZhFJQG', 'secretaire')
ON CONFLICT (username) DO NOTHING;

-- Insérer quelques badges de démonstration (optionnel)
INSERT INTO badges (nom, description, photo_url, stock, prix) VALUES 
    ('Badge VIP', 'Badge pour les conférenciers VIP', NULL, 10, 75000),
    ('Badge Standard', 'Badge standard pour les participants', NULL, 50, 25000),
    ('Badge Sponsor', 'Badge pour les sponsors de l\'événement', NULL, 5, 100000)
ON CONFLICT DO NOTHING;

-- ==========================================
-- VUES UTILES (optionnel)
-- ==========================================

-- Vue pour les badges en stock faible
CREATE OR REPLACE VIEW badges_stock_faible AS
SELECT 
    id,
    nom,
    description,
    stock,
    prix,
    CASE 
        WHEN stock = 0 THEN 'Rupture'
        WHEN stock <= 1 THEN 'Critique'
        ELSE 'Faible'
    END as niveau_alerte
FROM badges
WHERE stock <= 1
ORDER BY stock ASC, nom ASC;

-- Vue pour les statistiques de ventes
CREATE OR REPLACE VIEW stats_ventes AS
SELECT 
    b.id as badge_id,
    b.nom as badge_nom,
    COUNT(v.id) as nombre_ventes,
    SUM(v.quantite) as quantite_totale,
    SUM(v.prix_total) as revenu_total
FROM badges b
LEFT JOIN ventes v ON b.id = v.badge_id
GROUP BY b.id, b.nom
ORDER BY revenu_total DESC NULLS LAST;

-- Vue pour les statistiques de livraisons
CREATE OR REPLACE VIEW stats_livraisons AS
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
    COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
    COUNT(*) FILTER (WHERE statut = 'livree') as livrees,
    COUNT(*) FILTER (WHERE statut = 'annulee') as annulees,
    COALESCE(SUM(prix_total) FILTER (WHERE statut = 'livree'), 0) as revenu_livraisons
FROM livraisons;

-- ==========================================
-- PERMISSIONS (sécurité)
-- ==========================================

-- Révoquer tous les privilèges par défaut
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Accorder les privilèges nécessaires à l'utilisateur postgres
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ==========================================
-- VACUUM & ANALYZE (optimisation)
-- ==========================================

VACUUM ANALYZE users;
VACUUM ANALYZE badges;
VACUUM ANALYZE ventes;
VACUUM ANALYZE livraisons;

-- ==========================================
-- FIN DU SCRIPT
-- ==========================================

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données initialisée avec succès!';
    RAISE NOTICE '📊 Tables créées: users, badges, ventes, livraisons';
    RAISE NOTICE '👥 Utilisateurs par défaut: admin, secretaire';
    RAISE NOTICE '🔐 Mot de passe par défaut: password123';
END $$;