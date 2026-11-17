FROM node:22-alpine AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

FROM node:22-alpine AS api
WORKDIR /api
COPY api/package*.json ./
RUN npm ci
COPY api/ .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api /api/node_modules ./node_modules
COPY --from=api /api/dist ./dist
COPY --from=web /web/dist ./web
EXPOSE 3000
CMD ["node", "dist/main.js"]
