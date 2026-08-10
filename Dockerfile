# =============================================================================
# ChuniMai web app (Nuxt 4 / Nitro)
#
# Nitro's build output is self-contained — it bundles the server dependencies
# it actually uses into .output/server/node_modules — so the runtime stage
# needs no `npm install` at all, only Node and the output directory.
# =============================================================================

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Nothing about the API URL is baked in here. `apiBase` is runtime config, read
# from NUXT_PUBLIC_API_BASE when the server starts, so the same image works
# against staging and production.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Every interface *inside the container*; compose publishes only to 127.0.0.1.
ENV HOST=0.0.0.0
ENV PORT=3100

COPY --from=builder /app/.output ./.output

USER node

EXPOSE 3100

# A 200 alone would only prove Nitro is answering. The home page is server
# rendered, so its own title in the HTML proves the render ran rather than
# erroring into an empty shell.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/ | grep -q 'ChunithmQueue' || exit 1

CMD ["node", ".output/server/index.mjs"]
