# node:20-slim (Debian) required — node-canvas needs Cairo/Pango system libs
# Alpine lacks prebuilt canvas binaries and has limited pkg-config support
FROM node:20-slim

# Canvas system dependencies: Cairo, Pango, libjpeg, GIF, librsvg
RUN apt-get update && apt-get install -y --no-install-recommends \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  build-essential \
  pkg-config \
  openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first for better layer caching
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Migrate DB schema then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
