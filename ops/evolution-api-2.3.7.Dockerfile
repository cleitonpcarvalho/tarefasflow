FROM node:24-alpine AS builder

RUN apk update && \
    apk add --no-cache git ffmpeg wget curl bash openssl

WORKDIR /evolution

COPY package*.json ./
COPY tsconfig.json ./
COPY tsup.config.ts ./

RUN npm ci --silent

COPY src ./src
COPY public ./public
COPY prisma ./prisma
COPY manager ./manager
COPY .env.example ./.env
COPY runWithProvider.js ./
COPY Docker ./Docker

RUN chmod +x ./Docker/scripts/* && \
    dos2unix ./Docker/scripts/* && \
    ./Docker/scripts/generate_database.sh && \
    npm run build

FROM evoapicloud/evolution-api@sha256:6b195676b09abbbd8ac9372cd961674dea2587f23dc9bc1d1e6a595372556fb1

COPY --from=builder /evolution/dist /evolution/dist
