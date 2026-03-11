# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей из папки project
COPY project/package.json project/package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код из папки project
COPY project/ .

# Собираем приложение
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Устанавливаем serve глобально
RUN npm install -g serve

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Открываем порт 3000
EXPOSE 3000

# Запускаем serve с поддержкой SPA роутинга
CMD ["serve", "-s", "dist", "-l", "3000"]

