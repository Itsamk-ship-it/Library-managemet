# Frontend Dockerfile
FROM mirror.gcr.io/library/node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM mirror.gcr.io/library/nginx:alpine
COPY --from=build-frontend /app/frontend/dist /usr/share/nginx/html
COPY --from=build-frontend /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Backend Dockerfile
FROM mirror.gcr.io/library/node:20-alpine
# Install build dependencies for native modules and openssl for Prisma
RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app/backend
# Copy only the backend directory content
COPY backend/package*.json ./

# To avoid 'prisma generate' failing during 'npm install' (postinstall script),
# we install dependencies first, but since prisma generate needs the schema,
# we must copy the prisma folder BEFORE npm install if we want postinstall to work,
# OR skip postinstall and run it manually.
RUN npm install --ignore-scripts

COPY backend/ ./

# Now that schema.prisma is copied, generate the client
RUN npx prisma generate

EXPOSE 4000
CMD npx prisma db push && npm start