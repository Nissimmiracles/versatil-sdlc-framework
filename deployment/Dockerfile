# VERSATIL Framework v3.0.0 - Multi-Language Docker Image
# Supports TypeScript, Python, Go, Rust, Java, Ruby, PHP

# Base image with Node.js (for framework core)
FROM node:20-bullseye AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN curl -fsSL https://go.dev/dl/go1.21.5.linux-amd64.tar.gz | tar -C /usr/local -xzf - \
    && ln -s /usr/local/go/bin/go /usr/local/bin/go \
    && ln -s /usr/local/go/bin/gofmt /usr/local/bin/gofmt

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . $HOME/.cargo/env \
    && ln -s $HOME/.cargo/bin/rustc /usr/local/bin/rustc \
    && ln -s $HOME/.cargo/bin/cargo /usr/local/bin/cargo \
    && ln -s $HOME/.cargo/bin/rustfmt /usr/local/bin/rustfmt

# Install Java (OpenJDK 17)
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    maven \
    && rm -rf /var/lib/apt/lists/*

# Install Ruby
RUN apt-get update && apt-get install -y \
    ruby-full \
    && rm -rf /var/lib/apt/lists/*

# Install PHP
RUN apt-get update && apt-get install -y \
    php \
    php-cli \
    php-mbstring \
    php-xml \
    php-curl \
    composer \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy framework source
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY .claude/ ./.claude/

# Build TypeScript
RUN npm run build

# Expose framework ports
EXPOSE 3000 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node dist/index.js --health-check || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV VERSATIL_HOME=/app
ENV PATH="/usr/local/go/bin:$HOME/.cargo/bin:$PATH"

# Entry point
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--help"]