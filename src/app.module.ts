import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NetworkConfigService } from './network-config/network-config.service';
import { NetworkModule } from './network/network.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    NetworkModule,
    PrismaModule,
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, NetworkConfigService, AuthModule, UsersModule],
})
export class AppModule {}
