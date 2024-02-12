import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NetworkModule } from './network/network.module';
import { NetworkController } from './network/network.controller';
import { NetworkService } from './network/network.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [NetworkModule, AuthModule, UsersModule],
  controllers: [AppController, NetworkController],
  providers: [AppService, NetworkService],
})
export class AppModule {}
