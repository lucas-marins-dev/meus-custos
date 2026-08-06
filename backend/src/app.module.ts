import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserRole } from './entities/User';
import { Renda } from './entities/Renda';
import { Despesa } from './entities/Despesa';
import { Divida } from './entities/Divida';
import { ChatMessage } from './entities/ChatMessage';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RendaModule } from './modules/renda/renda.module';
import { DespesaModule } from './modules/despesa/despesa.module';
import { DividaModule } from './modules/divida/divida.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { UsuarioService } from './modules/usuario/usuario.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isTest = process.env.NODE_ENV === 'test';
        if (isTest || process.env.DB_TYPE === 'sqlite') {
          return {
            type: 'better-sqlite3' as any,
            database: ':memory:',
            entities: [User, Renda, Despesa, Divida, ChatMessage],
            synchronize: true,
          };
        }
        return {
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 3306,
          username: process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD || 'root',
          database: process.env.DB_DATABASE || 'gerenciamento_custos',
          entities: [User, Renda, Despesa, Divida, ChatMessage],
          synchronize: true, // Em dev cria as tabelas automaticamente
          autoLoadEntities: true,
        };
      },
    }),
    AuthModule,
    UsuarioModule,
    RendaModule,
    DespesaModule,
    DividaModule,
    DashboardModule,
    AiChatModule,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly usuarioService: UsuarioService) {}

  async onModuleInit() {
    // Semeia o usuário Master Admin inicial se nenhum usuário existir no banco
    try {
      const usuarios = await this.usuarioService.listarTodos();
      if (usuarios.length === 0) {
        this.logger.log('Semeando Usuário Master Admin inicial...');
        await this.usuarioService.criar({
          nome: 'Admin Master',
          email: 'admin@sistema.com',
          senha: 'admin123password',
          role: UserRole.ADMIN,
        });
        this.logger.log('Usuário Master criado com sucesso (admin@sistema.com / admin123password)');
      }
    } catch (err) {
      this.logger.warn('Não foi possível verificar/criar usuário Admin inicial:', err.message);
    }
  }
}
