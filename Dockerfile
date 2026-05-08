FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Si sharp falla en alpine durante el build, descomentar:
# RUN apk add --no-cache vips-dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "index.js"]
