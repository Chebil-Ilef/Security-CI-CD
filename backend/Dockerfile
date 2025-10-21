FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# 🟢 ajoute cette ligne :
COPY tsconfig.build.json ./

# déjà présent :
COPY tsconfig.json ./
COPY src ./src

RUN npm run build
CMD ["npm", "run", "start"]