import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@CurrentUser() user: any) {
    return this.dashboardService.summary(user);
  }

  @Get('recent-payments')
  recentPayments(@CurrentUser() user: any) {
    return this.dashboardService.recentPayments(user);
  }

  @Get('recent-customers')
  recentCustomers(@CurrentUser() user: any) {
    return this.dashboardService.recentCustomers(user);
  }
}