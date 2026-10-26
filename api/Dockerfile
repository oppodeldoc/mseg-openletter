FROM node:22-alpine

# curl is used by the container healthcheck (GET /health)
RUN apk add --no-cache curl

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . /app

# AdonisJS 4 crashes if .env doesn't exist; all config comes from the runtime environment
RUN touch /app/.env

EXPOSE 3000

# docker-compose overrides this with: node ace migration:run --force && npm start
CMD ["npm", "start"]
