import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  @Get('invoices')
  findInvoices() {
    return this.billingService.findInvoices();
  }

  @Get('invoices/:id')
  findInvoice(@Param('id') id: string) {
    return this.billingService.findInvoice(id);
  }

  @Post('payments')
  recordPayment(@Body() dto: CreatePaymentDto) {
    return this.billingService.recordPayment(dto);
  }

  @Get('payments')
  findPayments() {
    return this.billingService.findPayments();
  }

  @Get('summary')
  summary() {
    return this.billingService.summary();
  }
}