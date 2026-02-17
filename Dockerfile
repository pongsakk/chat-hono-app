FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]
