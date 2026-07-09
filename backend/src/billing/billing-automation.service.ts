import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CustomerStatus } from '@prisma/client';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';
import { MikrotikService } from '../mikrotik/mikrotik.service';

@Injectable()
export class BillingAutomationService implements OnModuleInit {
  private readonly logger = new Logger(BillingAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mikrotikService: MikrotikService,
  ) {}

  onModuleInit() {
    cron.schedule('0 0 * * *', async () => {
      this.logger.log('Running daily expiry job');
      await this.expireDueCustomers();
    });
  }

  async expireDueCustomers() {
    const now = new Date();

    const customers = await this.prisma.customer.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: CustomerStatus.ACTIVE,
      },
      include: {
        pppAccount: true,
      },
    });

    const results: any[] = [];

    for (const customer of customers) {
      const updated = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          status: CustomerStatus.EXPIRED,
          pppAccount: {
            update: {
              disabled: true,
            },
          },
        },
        include: {
          pppAccount: true,
        },
      });

      let routerSync: any = null;

      if (customer.pppAccount) {
        routerSync = await this.mikrotikService
          .disablePppSecret(customer.routerId, customer.pppAccount.username)
          .catch((error) => ({
            success: false,
            message: error.message,
          }));
      }

      results.push({
        customerId: updated.id,
        customerNo: updated.customerNo,
        fullName: updated.fullName,
        username: updated.pppAccount?.username,
        expired: true,
        routerSync,
      });

      this.logger.log(`Expired customer ${customer.customerNo}`);
    }

    return {
      success: true,
      expiredCount: results.length,
      results,
    };
  }
}