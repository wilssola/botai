FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run db-generate
RUN npm run build
RUN npm run docs
CMD [ "npm", "run", "docker" ]
