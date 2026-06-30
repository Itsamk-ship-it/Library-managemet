# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# OpenSSL is required by Prisma engines.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 4000
# Sync the schema to the database on boot, then start the API.
# (Ships without migration files, so `db push` is the source of truth.)
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
