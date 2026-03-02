# Ambulance QR API — production image with Puppeteer (Chromium) for PDF
FROM node:20-bookworm-slim

WORKDIR /app

# Chromium deps for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
RUN mkdir -p uploads

EXPOSE 5000
CMD ["node", "src/server.js"]
