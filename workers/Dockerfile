FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
USER node
# Node 24 ejecuta TypeScript directamente (type stripping), sin paso de build.
CMD ["node", "src/proyector.ts"]
