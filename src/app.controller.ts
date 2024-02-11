import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health-check')
  async getHealth(): Promise<any> {
    return {
      status: `${new Date().toLocaleString()}: [App Controller] Initializing check application health function.`,
    };
  }
}
