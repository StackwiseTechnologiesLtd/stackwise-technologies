FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY scripts/growth-browser-lib.mjs scripts/growth-connect-server.mjs ./scripts/

ENV GROWTH_CONNECT_HOST=0.0.0.0
ENV GROWTH_CONNECT_PORT=8080
EXPOSE 8080

CMD ["node", "scripts/growth-connect-server.mjs"]
