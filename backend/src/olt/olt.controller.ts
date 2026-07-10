import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OltService } from './olt.service';

@UseGuards(JwtAuthGuard)
@Controller('olts')
export class OltController {
  constructor(private readonly oltService: OltService) {}

  @Get('summary')
  summary(@CurrentUser() user: any) {
    return this.oltService.oltSummary(user);
  }

  @Post()
  createOlt(@CurrentUser() user: any, @Body() dto: any) {
    return this.oltService.createOlt(user, dto);
  }

  @Get()
  findAllOlts(@CurrentUser() user: any) {
    return this.oltService.findAllOlts(user);
  }

  @Get('onus')
  findAllOnus(@CurrentUser() user: any) {
    return this.oltService.findAllOnus(user);
  }

  @Post('onus')
  createOnu(@CurrentUser() user: any, @Body() dto: any) {
    return this.oltService.createOnu(user, dto);
  }

  @Delete('onus/:id')
  removeOnu(@CurrentUser() user: any, @Param('id') id: string) {
    return this.oltService.removeOnu(user, id);
  }

  @Get(':id/onus')
  findOnusByOlt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.oltService.findOnusByOlt(user, id);
  }

  @Post(':id/test')
  testOltConnection(@CurrentUser() user: any, @Param('id') id: string) {
    return this.oltService.testOltConnection(user, id);
  }

  @Get(':id')
  findOlt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.oltService.findOlt(user, id);
  }

  @Patch(':id')
  updateOlt(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.oltService.updateOlt(user, id, dto);
  }

  @Delete(':id')
  removeOlt(@CurrentUser() user: any, @Param('id') id: string) {
    return this.oltService.removeOlt(user, id);
  }
}