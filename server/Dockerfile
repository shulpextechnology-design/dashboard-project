FROM node:18

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the server code
COPY . .

# Hugging Face Spaces listen on port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["node", "index.js"]
