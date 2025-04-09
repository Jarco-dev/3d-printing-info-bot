FROM node:20.15.1-alpine AS base

WORKDIR /usr/src/app

FROM base AS deps

COPY package*.json ./
COPY ./prisma ./prisma

RUN apk add --no-cache python3 make g++
RUN npm ci
RUN npx prisma generate

FROM deps AS development

RUN rm -rf ./prisma
RUN apk add --no-cache bash

USER node

CMD npx prisma migrate deploy && npm run dev

FROM deps AS build

COPY ./src ./src
COPY tsconfig.json ./tsconfig.json

RUN npm run build

FROM base AS production

RUN mkdir storage
RUN chown -R node:node /usr/src/app

USER node

COPY package.json .
COPY ./prisma ./prisma
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

CMD npx prisma migrate deploy && npm run start
