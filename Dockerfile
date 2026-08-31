FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM dependencies AS test
COPY . .
CMD ["npm", "run", "check"]

FROM dependencies AS build
COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS preview
COPY --from=build /app/dist /usr/share/nginx/html/ultimate-tic-tac-toe
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080

FROM node:22-bookworm-slim AS e2e
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium
COPY . .
CMD ["npm", "run", "test:e2e"]
