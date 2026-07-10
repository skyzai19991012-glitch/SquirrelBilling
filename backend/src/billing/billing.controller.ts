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
import { BillingService } from './billing.service';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  summary(@CurrentUser() user: any) {
    return this.billingService.summary(user);
  }

  @Get('invoices')
  invoices(@CurrentUser() user: any) {
    return this.billingService.findInvoices(user);
  }

  @Post('invoices')
  createInvoice(@CurrentUser() user: any, @Body() dto: any) {
    return this.billingService.createInvoice(user, dto);
  }

  @Patch('invoices/:id')
  updateInvoice(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.billingService.updateInvoice(user, id, dto);
  }

  @Delete('invoices/:id')
  deleteInvoice(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billingService.deleteInvoice(user, id);
  }

  @Get('payments')
  payments(@CurrentUser() user: any) {
    return this.billingService.findPayments(user);
  }

  @Post('payments')
  createPayment(@CurrentUser() user: any, @Body() dto: any) {
    return this.billingService.createPayment(user, dto);
  }

  @Patch('payments/:id')
  updatePayment(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.billingService.updatePayment(user, id, dto);
  }

  @Delete('payments/:id')
  deletePayment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.billingService.deletePayment(user, id);
  }

  @Post('run-expiry')
  runExpiry(@CurrentUser() user: any) {
    return this.billingService.runExpiry(user);
  }
}