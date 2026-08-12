FROM node:18

WORKDIR /app

# Copy server dependencies and install
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server source code
COPY server/ ./server/

WORKDIR /app/server

# Hugging Face Spaces default port
ENV PORT=7860
EXPOSE 7860

CMD ["node", "index.js"]
