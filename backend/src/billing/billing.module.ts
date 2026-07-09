import { Module } from '@nestjs/common';
import { MikrotikModule } from '../mikrotik/mikrotik.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingAutomationService } from './billing-automation.service';

@Module({
  imports: [MikrotikModule],
  controllers: [BillingController],
  providers: [BillingService, BillingAutomationService],
  exports: [BillingService, BillingAutomationService],
})
export class BillingModule {}