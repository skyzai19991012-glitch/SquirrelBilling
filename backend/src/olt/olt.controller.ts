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
import { OltService } from './olt.service';
import { CreateOltDto } from './dto/create-olt.dto';
import { UpdateOltDto } from './dto/update-olt.dto';
import { CreateOnuDto } from './dto/create-onu.dto';
import { UpdateOnuDto } from './dto/update-onu.dto';

@UseGuards(JwtAuthGuard)
@Controller('olts')
export class OltController {
  constructor(private readonly oltService: OltService) {}

  @Get('summary')
  summary() {
    return this.oltService.oltSummary();
  }

  @Post()
  createOlt(@Body() dto: CreateOltDto) {
    return this.oltService.createOlt(dto);
  }

  @Get()
  findAllOlts() {
    return this.oltService.findAllOlts();
  }

  @Get('onus')
  findAllOnus() {
    return this.oltService.findAllOnus();
  }

  @Post('onus')
  createOnu(@Body() dto: CreateOnuDto) {
    return this.oltService.createOnu(dto);
  }

  @Get('onus/:id')
  findOnu(@Param('id') id: string) {
    return this.oltService.findOnu(id);
  }

  @Patch('onus/:id')
  updateOnu(@Param('id') id: string, @Body() dto: UpdateOnuDto) {
    return this.oltService.updateOnu(id, dto);
  }

  @Delete('onus/:id')
  removeOnu(@Param('id') id: string) {
    return this.oltService.removeOnu(id);
  }

  @Get(':id/onus')
  findOnusByOlt(@Param('id') id: string) {
    return this.oltService.findOnusByOlt(id);
  }

  @Post(':id/test')
  testOltConnection(@Param('id') id: string) {
    return this.oltService.testOltConnection(id);
  }

  @Get(':id')
  findOlt(@Param('id') id: string) {
    return this.oltService.findOlt(id);
  }

  @Patch(':id')
  updateOlt(@Param('id') id: string, @Body() dto: UpdateOltDto) {
    return this.oltService.updateOlt(id, dto);
  }

  @Delete(':id')
  removeOlt(@Param('id') id: string) {
    return this.oltService.removeOlt(id);
  }
}