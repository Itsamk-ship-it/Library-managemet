# Frontend Build Stage
FROM mirror.gcr.io/library/node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Frontend Serve Stage (Nginx)
FROM mirror.gcr.io/library/nginx:alpine
COPY --from=build-frontend /app/frontend/dist /usr/share/nginx/html
# Ensure nginx.conf is copied if it exists, otherwise use default
COPY --from=build-frontend /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Backend Stage
FROM mirror.gcr.io/library/node:20-alpine
RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app/backend
# Copy package files and the prisma folder first to allow prisma generate during install
COPY backend/package*.json ./ 
COPY backend/prisma ./prisma/

# Install dependencies (including prisma client generation via postinstall if present)
RUN npm install

# Copy remaining backend source
COPY backend/ ./

# Explicitly generate prisma client to be sure
RUN npx prisma generate

EXPOSE 4000
# Use a shell script or combined command to handle migrations and startup
CMD npx prisma db push && npm start