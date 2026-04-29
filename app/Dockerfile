# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Patch OS vulnerabilities
RUN apk update && apk upgrade --no-cache

COPY package*.json ./
RUN npm install

COPY . .

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Patch OS vulnerabilities in runtime
RUN apk update && apk upgrade --no-cache && \
    npm install -g npm@latest

# Only copy production dependencies and source
COPY --from=build /app/package*.json ./
RUN npm install --only=production

COPY --from=build /app/src ./src

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
