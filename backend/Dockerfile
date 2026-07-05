FROM node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

COPY backend ./backend
COPY database ./database

RUN ./node_modules/.bin/prisma generate --schema=database/prisma/schema.prisma
RUN npm run build -w backend

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY database ./database

RUN npm ci --omit=dev
RUN ./node_modules/.bin/prisma generate --schema=database/prisma/schema.prisma
RUN npm cache clean --force

COPY --from=build /app/backend/dist ./backend/dist

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "backend"]
