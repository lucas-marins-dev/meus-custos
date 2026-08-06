import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. OWASP A05 - Configuração de Cabeçalhos de Segurança com Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Desabilitado para facilidade em dev local
    }),
  );

  // 2. Parser de cookies para ler JWT HTTP-Only em req.cookies
  app.use(cookieParser());

  // 3. OWASP A01 & A05 - Configuração de CORS (Flexível para Produção / VPS)
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:80', 'http://localhost'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 4. Prefixo global da API
  app.setGlobalPrefix('api');

  // 5. OWASP A03 - Validação e Sanitização Global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Backend NestJS rodando na porta http://localhost:${port}/api`);
}
bootstrap();
