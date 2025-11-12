#!/bin/sh
set -e

echo "🚀 Démarrage du backend Badge Ketaka..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de la base de données..."
until nc -z -v -w30 $DB_HOST $DB_PORT
do
  echo "⏳ En attente de PostgreSQL sur $DB_HOST:$DB_PORT..."
  sleep 2
done

echo "✅ Base de données accessible!"

# Vérifier si les variables d'environnement essentielles sont définies
if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERREUR: JWT_SECRET n'est pas défini!"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  ATTENTION: DB_PASSWORD n'est pas défini (utilisation de la valeur par défaut)"
fi

#Verifier DATABASE_URL pour prisma
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERREUR: DATABASE_URL n'est pas défini!"
    echo "ℹ️  Prisma a besoin de DATABASE_URL pour fonctionner"
    exit 1
fi

echo "✅ DATABASE_URL est défini"

# Créer le dossier uploads s'il n'existe pas
mkdir -p /app/uploads
chmod 755 /app/uploads

echo "📁 Dossier uploads créé: /app/uploads"

# Afficher la configuration (sans les secrets)
echo "📋 Configuration:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo "  - DB_HOST: $DB_HOST"
echo "  - DB_NAME: $DB_NAME"
echo "  - DB_USER: $DB_USER"

# ===== AJOUT PRISMA =====
echo ""
echo "🔧 Configuration de Prisma..."

# Générer le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ ERREUR: Échec de la génération du client Prisma!"
    exit 1
fi

echo "✅ Client Prisma généré"

# Exécuter les migrations Prisma
echo "📊 Application des migrations de base de données..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ ERREUR: Échec des migrations Prisma!"
    echo "ℹ️  Vérifiez que:"
    echo "    - DATABASE_URL est correctement configuré"
    echo "    - Les fichiers de migration existent dans prisma/migrations/"
    echo "    - La base de données est accessible"
    exit 1
fi

echo "✅ Migrations appliquées avec succès"

# Optionnel: Afficher l'état de la base de données
echo "📊 Statut de la base de données:"
npx prisma db status || true

echo ""
echo "✅ Configuration Prisma terminée"
# ===== FIN AJOUT PRISMA =====

# Exécuter la commande passée en argument (par défaut: node server.js)
echo ""
echo "▶️  Démarrage de l'application..."
exec "$@"