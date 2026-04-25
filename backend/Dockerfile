FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate
COPY src ./src
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
