# Stage 1: Install dependencies
FROM node:20-alpine as base
WORKDIR /app

COPY package*.json ./
RUN npm install

# Stage 2: Run development server
FROM base as dev
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 3: Build static assets
FROM base as builder
COPY . .
RUN npm run build

# Stage 4: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html
