import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }

  @Get('recent-payments')
  recentPayments() {
    return this.dashboardService.recentPayments();
  }

  @Get('recent-customers')
  recentCustomers() {
    return this.dashboardService.recentCustomers();
  }
}