FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.build.json ./

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
CMD ["npm", "run", "start"]