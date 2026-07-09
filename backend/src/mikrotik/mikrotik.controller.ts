import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MikrotikService } from './mikrotik.service';

@UseGuards(JwtAuthGuard)
@Controller('mikrotik')
export class MikrotikController {
  constructor(private readonly mikrotikService: MikrotikService) {}

  @Get('routers/:routerId/profiles')
  getProfiles(@Param('routerId') routerId: string) {
    return this.mikrotikService.getProfiles(routerId);
  }

  @Get('routers/:routerId/secrets')
  getSecrets(@Param('routerId') routerId: string) {
    return this.mikrotikService.getSecrets(routerId);
  }

  @Get('routers/:routerId/active')
  getActiveSessions(@Param('routerId') routerId: string) {
    return this.mikrotikService.getActiveSessions(routerId);
  }

  @Post('routers/:routerId/import')
  importFromRouter(@Param('routerId') routerId: string) {
    return this.mikrotikService.importFromRouter(routerId);
  }
}