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
import { CustomersService } from './customers.service';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.customersService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.customersService.findAll(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.findOne(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.customersService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.remove(user, id);
  }

  @Post(':id/suspend')
  suspend(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.suspend(user, id);
  }

  @Post(':id/activate')
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.activate(user, id);
  }
}