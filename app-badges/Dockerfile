# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer toutes les dépendances avec cache et optimisations
RUN npm ci --prefer-offline --no-audit --progress=false

# Copier le reste des fichiers
COPY . .

# Augmenter la mémoire Node.js pour éviter les crashes
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build l'application avec fallback si les budgets échouent
RUN npm run build -- --configuration production || \
    npm run build -- --configuration production --skip-nx-cache || \
    npm run build

# Stage 2: Production avec Nginx
FROM nginx:alpine

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés
COPY --from=builder /app/www /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]