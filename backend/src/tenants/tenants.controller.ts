import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantsService } from './tenants.service';

@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  private ensureSuperAdmin(user: any) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can access tenants');
    }
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    this.ensureSuperAdmin(user);
    return this.tenantsService.findAll();
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    this.ensureSuperAdmin(user);
    return this.tenantsService.create(dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    this.ensureSuperAdmin(user);
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureSuperAdmin(user);
    return this.tenantsService.remove(id);
  }

  @Post(':id/activate')
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureSuperAdmin(user);
    return this.tenantsService.activate(id);
  }

  @Post(':id/suspend')
  suspend(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureSuperAdmin(user);
    return this.tenantsService.suspend(id);
  }
}