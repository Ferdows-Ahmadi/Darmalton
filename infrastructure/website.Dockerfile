# syntax=docker/dockerfile:1.7

FROM node:24.18.0-alpine AS dependencies
WORKDIR /app
ENV NPM_CONFIG_FETCH_RETRIES=8 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=30000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=180000
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --prefer-offline

FROM node:24.18.0-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . ./
RUN npm run build

FROM node:24.18.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
