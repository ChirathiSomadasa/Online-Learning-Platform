FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY swagger.yaml ./
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser
EXPOSE 3004

CMD ["node", "src/index.js"]