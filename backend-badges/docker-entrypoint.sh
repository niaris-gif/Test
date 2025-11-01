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

# Exécuter la commande passée en argument (par défaut: node server.js)
echo "▶️  Démarrage de l'application..."
exec "$@"