FROM node:22-alpine AS development
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

EXPOSE 3000
CMD ["npm", "run", "dev:docker"]

FROM node:22-alpine AS production
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
