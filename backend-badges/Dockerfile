# ==========================================
# Stage 1: Base
# ==========================================
FROM node:22-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    tini \
    dumb-init

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# ==========================================
# Stage 2: Dependencies
# ==========================================
FROM base AS dependencies

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (incluant Prisma CLI)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Installer les dépendances de production
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copier les node_modules pour l'étape suivante
RUN cp -R node_modules /tmp/node_modules

# Installer toutes les dépendances (dev inclus) pour le build
RUN npm ci --ignore-scripts 

# ==========================================
# Stage 3: Build (si vous avez du TypeScript)
# ==========================================
FROM base AS build

WORKDIR /app

# Copier les dépendances
COPY --from=dependencies /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Si vous utilisez TypeScript, décommentez :
# RUN npm run build

# ==========================================
# Stage 4: Production
# ==========================================
FROM base AS production

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=Indian/Antananarivo

# Installer curl pour les health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copier les dépendances de production depuis le stage dependencies
COPY --from=dependencies /tmp/node_modules ./node_modules

# Copier le schéma et les migrations Prisma
COPY --chown=nodejs:nodejs prisma ./prisma

# Copier le code source
COPY --chown=nodejs:nodejs . .

# Créer les dossiers nécessaires
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs uploads && \
    chmod 755 uploads

# Créer un fichier .gitkeep dans uploads
RUN touch uploads/.gitkeep

# Copier le script d'entrypoint
COPY --chown=nodejs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Passer à l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Point d'entrée
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]

# Commande par défaut
CMD ["node", "server.js"]
