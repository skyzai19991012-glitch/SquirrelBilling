import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Post('routers/:routerId/ppp/:username/disable')
  disablePpp(@Param('routerId') routerId: string, @Param('username') username: string) {
    return this.mikrotikService.disablePppSecret(routerId, username);
  }

  @Post('routers/:routerId/ppp/:username/enable')
  enablePpp(@Param('routerId') routerId: string, @Param('username') username: string) {
    return this.mikrotikService.enablePppSecret(routerId, username);
  }

  @Post('routers/:routerId/ppp/:username/disconnect')
  disconnectPpp(@Param('routerId') routerId: string, @Param('username') username: string) {
    return this.mikrotikService.disconnectPppUser(routerId, username);
  }

  @Post('routers/:routerId/ppp/:username/profile')
  changeProfile(
    @Param('routerId') routerId: string,
    @Param('username') username: string,
    @Body() body: { profile: string },
  ) {
    return this.mikrotikService.changePppProfile(routerId, username, body.profile);
  }
}