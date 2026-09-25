FROM node:20-bookworm-slim

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=7860

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel verbose 2>&1 | tee /tmp/npm-ci.log

COPY server/ ./

EXPOSE 7860

CMD ["node", "index.js"]
