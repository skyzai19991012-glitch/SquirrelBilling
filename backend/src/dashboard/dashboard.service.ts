import { Injectable } from '@nestjs/common';
import { CustomerStatus, InvoiceStatus } from '@prisma/client';
import { tenantFilter } from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(user: any) {
    const filter = tenantFilter(user);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      customersTotal,
      customersActive,
      customersSuspended,
      customersExpired,
      routersTotal,
      routersActive,
      packagesTotal,
      invoicesPending,
      todayCollection,
      monthlyCollection,
      outstanding,
      totalOlts,
      activeOlts,
      totalOnus,
      onlineOnus,
    ] = await Promise.all([
      this.prisma.customer.count({ where: filter }),
      this.prisma.customer.count({
        where: { ...filter, status: CustomerStatus.ACTIVE },
      }),
      this.prisma.customer.count({
        where: { ...filter, status: CustomerStatus.SUSPENDED },
      }),
      this.prisma.customer.count({
        where: { ...filter, status: CustomerStatus.EXPIRED },
      }),
      this.prisma.router.count({ where: filter }),
      this.prisma.router.count({ where: { ...filter, active: true } }),
      this.prisma.internetPackage.count({ where: filter }),
      this.prisma.invoice.count({
        where: {
          ...filter,
          status: {
            in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...filter,
          createdAt: { gte: todayStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...filter,
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...filter,
          status: {
            in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
          },
        },
        _sum: { balance: true },
      }),
      this.prisma.oltDevice.count({ where: filter }),
      this.prisma.oltDevice.count({ where: { ...filter, active: true } }),
      this.prisma.onuDevice.count({ where: filter }),
      this.prisma.onuDevice.count({ where: { ...filter, online: true } }),
    ]);

    return {
      customers: {
        total: customersTotal,
        active: customersActive,
        suspended: customersSuspended,
        expired: customersExpired,
      },
      routers: {
        total: routersTotal,
        active: routersActive,
      },
      packages: {
        total: packagesTotal,
      },
      billing: {
        pendingInvoices: invoicesPending,
        todayCollection: todayCollection._sum.amount || 0,
        monthlyCollection: monthlyCollection._sum.amount || 0,
        outstanding: outstanding._sum.balance || 0,
      },
      olt: {
        totalOlts,
        activeOlts,
        totalOnus,
        onlineOnus,
      },
    };
  }

  async recentPayments(user: any) {
    return this.prisma.payment.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        customer: true,
        invoice: true,
      },
    });
  }

  async recentCustomers(user: any) {
    return this.prisma.customer.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        router: true,
        package: true,
        pppAccount: true,
      },
    });
  }
}