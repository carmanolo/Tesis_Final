FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL=/api
ARG API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
ENV API_URL=${API_URL}
RUN npm run build

CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "5173"]