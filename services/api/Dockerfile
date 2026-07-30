# Build context is the REPO ROOT (monorepo). Deploy from the repo root with:
#   fly deploy . --config services/api/fly.toml --dockerfile services/api/Dockerfile
FROM node:22-alpine AS build
ENV CI=true
RUN corepack enable
WORKDIR /repo

# Install with a pruned dependency graph (api + shared only — web is never pulled in).
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/api/package.json services/api/
RUN pnpm install --frozen-lockfile --filter @overhear/shared --filter @overhear/api

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY services/api services/api
RUN pnpm --filter @overhear/shared build && pnpm --filter @overhear/api build

# Drop dev dependencies for the runtime image.
RUN pnpm install --frozen-lockfile --prod --filter @overhear/shared --filter @overhear/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app
COPY --from=build /repo /app
USER node
EXPOSE 8080
CMD ["node", "services/api/dist/index.js"]
