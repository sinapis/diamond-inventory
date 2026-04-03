
# Build stage for React
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend-dist

EXPOSE 3001
CMD ["node", "backend/index.js"]
