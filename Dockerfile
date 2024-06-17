FROM node:21.6.2-alpine

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "build"]

EXPOSE 3000