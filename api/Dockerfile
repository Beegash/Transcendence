FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files including SQL migrations
COPY . .

# Build TypeScript
RUN npm run build

# Copy SQL migrations to dist (TypeScript doesn't copy non-ts files)
RUN mkdir -p dist/db/migrations && cp -r src/db/migrations/*.sql dist/db/migrations/

EXPOSE 8080

CMD ["npm", "start"]
