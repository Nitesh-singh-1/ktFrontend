# Build stage — produces a static export (next.config.ts: output: "export").
# This app is a pure client-side SPA that talks to a separately-hosted API
# (services/baseservice.ts -> NEXT_PUBLIC_API_URL), so there is no Node.js
# server needed in production at all — just static files behind nginx.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# package.json's devDependencies include electron/electron-builder for the desktop
# build (irrelevant to this static-export Docker image); skip electron's binary
# postinstall download so npm ci doesn't fetch ~100MB it'll never use.
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars are inlined into the JS bundle at BUILD time for a static
# export (there is no server to read them at runtime), so this must be a
# build arg passed via `docker build --build-arg` / compose `args:`.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Runtime stage — plain static file server. `out/` is the static export.
FROM nginx:1.27-alpine AS final
COPY --from=build /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
