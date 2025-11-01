# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer toutes les dépendances (y compris dev)
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Build l'application
RUN npm run build -- --configuration production

# Stage 2: Production avec Nginx
FROM nginx:alpine

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés
COPY --from=builder /app/www /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]