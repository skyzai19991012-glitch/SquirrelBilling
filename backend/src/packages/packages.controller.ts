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
import { PackagesService } from './packages.service';

@UseGuards(JwtAuthGuard)
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.packagesService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.packagesService.findAll(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.packagesService.findOne(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.packagesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.packagesService.remove(user, id);
  }
}