#!/bin/bash

echo "🚀 Déploiement de l'application Badge Ketaka"

# Générer un secret JWT si non défini
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(openssl rand -hex 64)
    echo "JWT_SECRET=$JWT_SECRET" >> .env
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose build --no-cache

# Démarrer les services
echo "▶️  Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier l'état des services
echo "✅ Vérification de l'état des services..."
docker-compose ps

# Obtenir le certificat SSL (première fois uniquement)
echo "🔒 Configuration SSL..."
docker-compose run --rm certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Recharger Nginx
docker-compose exec nginx-proxy nginx -s reload

echo "✨ Déploiement terminé!"
echo "🌐 Application disponible sur: https://$DOMAIN"