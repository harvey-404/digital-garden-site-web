# 构建阶段
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Vite 在 build 时内嵌；由 compose 从 deploy/.env 传入
ARG VITE_AMAP_KEY=
ARG VITE_AMAP_SECURITY_JS_CODE=
ENV VITE_AMAP_KEY=$VITE_AMAP_KEY
ENV VITE_AMAP_SECURITY_JS_CODE=$VITE_AMAP_SECURITY_JS_CODE
ENV VITE_API_BASE_URL=/api

RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
