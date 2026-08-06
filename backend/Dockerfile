# 1. Estágio de Compilação (Build)
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies necessárias para o build)
RUN npm ci

# Copia todo o código-fonte
COPY . .

# Compila a aplicação NestJS para TypeScript/JS em /app/dist
RUN npm run build

# 2. Estágio de Execução em Produção (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copia os arquivos de dependência e instala apenas as de produção
COPY package*.json ./
RUN npm ci --only=production

# Copia os arquivos compilados do estágio anterior
COPY --from=builder /app/dist ./dist

# Expõe a porta configurada no NestJS
EXPOSE 3001

CMD ["node", "dist/main"]
