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
import { RoutersService } from './routers.service';

@UseGuards(JwtAuthGuard)
@Controller('routers')
export class RoutersController {
  constructor(private readonly routersService: RoutersService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.routersService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.routersService.findAll(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routersService.findOne(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.routersService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routersService.remove(user, id);
  }

  @Post(':id/test')
  test(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routersService.testRouterConnection(user, id);
  }
}