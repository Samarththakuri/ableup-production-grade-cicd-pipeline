FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# Creates uploads directory if local storage is used for multer and sets ownership
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5000
CMD ["npm", "run", "start"]
