import { Module } from '@nestjs/common';
import { NetworkConfigService } from './network-config.service';

@Module({
  providers: [NetworkConfigService],
  exports: [NetworkConfigService],
})
export class NetworkConfigModule {}
