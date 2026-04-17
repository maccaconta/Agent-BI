# ─── Builder ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package.json package-lock.json ./
RUN npm ci

# Copia código e faz o build
COPY . .
# Ignora erros de lint/typescript durante o build de produção para velocidade na demo
ENV NEXT_TELEMETRY_DISABLED 1
ENV IS_DOCKER=true
RUN npm run build

# ─── Runner ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copia apenas o necessário do builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
