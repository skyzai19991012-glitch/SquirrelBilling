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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoutersService } from './routers.service';
import { CreateRouterDto } from './dto/create-router.dto';
import { UpdateRouterDto } from './dto/update-router.dto';

@UseGuards(JwtAuthGuard)
@Controller('routers')
export class RoutersController {
  constructor(private readonly routersService: RoutersService) {}

  @Post()
  create(@Body() dto: CreateRouterDto) {
    return this.routersService.create(dto);
  }

  @Get()
  findAll() {
    return this.routersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRouterDto) {
    return this.routersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routersService.remove(id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string) {
    return this.routersService.testConnection(id);
  }
}