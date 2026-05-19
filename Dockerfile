FROM node:22-bookworm-slim

# Chrome headless shell dependencies — installed to standard /usr/lib paths
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
  ffmpeg \
  libnss3 \
  libnspr4 \
  libdbus-1-3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @wowcut/db exec prisma generate
RUN pnpm --filter @wowcut/workers build

CMD ["pnpm", "--filter", "@wowcut/workers", "start"]
