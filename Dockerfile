FROM node:18.13.0-alpine3.17 AS node
RUN mkdir /app && chown -R node:node /app

FROM node AS deps
USER node
WORKDIR /app
COPY --chown=node package.json yarn.lock ./
RUN yarn install

FROM node AS proddeps
USER node
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile \
  && npm prune --production --legacy-peer-deps

FROM node AS builder
USER node
WORKDIR /app
COPY --chown=node . .
COPY --chown=node ./deploy/prod/.env.production ./.env
COPY --chown=node --from=deps /app/node_modules ./node_modules
RUN yarn build

FROM node as release
USER node
WORKDIR /app
COPY --chown=node --from=builder /app/dist ./dist
COPY --chown=node --from=proddeps /app/node_modules ./node_modules
COPY --chown=node --from=builder /app/public ./public
COPY --chown=node --from=builder /app/server ./server

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server/entry.express"]