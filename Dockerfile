FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY data ./data

RUN npm run generate
RUN npx tsc

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=prod
ENV PORT=8000

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/data ./data

EXPOSE 8000

CMD ["node", "dist/server.js"]