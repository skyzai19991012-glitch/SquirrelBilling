import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHome() {
    return {
      app: 'Squirrel Networks ISP Suite',
      status: 'running',
      version: '1.0.0',
      endpoints: {
        login: 'POST /auth/login',
        me: 'GET /auth/me',
      },
    };
  }
}