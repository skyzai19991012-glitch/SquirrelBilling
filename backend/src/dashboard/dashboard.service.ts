import { Injectable } from '@nestjs/common';
import { CustomerStatus, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      expiredCustomers,
      totalRouters,
      activeRouters,
      totalPackages,
      activePackages,
      totalOlts,
      activeOlts,
      totalOnus,
      onlineOnus,
      pendingInvoices,
      overdueInvoices,
      todayPayments,
      monthlyPayments,
      outstandingInvoices,
    ] = await Promise.all([
      this.prisma.customer.count(),

      this.prisma.customer.count({
        where: { status: CustomerStatus.ACTIVE },
      }),

      this.prisma.customer.count({
        where: { status: CustomerStatus.SUSPENDED },
      }),

      this.prisma.customer.count({
        where: { status: CustomerStatus.EXPIRED },
      }),

      this.prisma.router.count(),

      this.prisma.router.count({
        where: { active: true },
      }),

      this.prisma.internetPackage.count(),

      this.prisma.internetPackage.count({
        where: { active: true },
      }),

      this.prisma.oltDevice.count(),

      this.prisma.oltDevice.count({
        where: { active: true },
      }),

      this.prisma.onuDevice.count(),

      this.prisma.onuDevice.count({
        where: { online: true },
      }),

      this.prisma.invoice.count({
        where: {
          status: {
            in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL],
          },
        },
      }),

      this.prisma.invoice.count({
        where: {
          dueDate: {
            lt: new Date(),
          },
          status: {
            in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL],
          },
        },
      }),

      this.prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.invoice.aggregate({
        where: {
          status: {
            in: [
              InvoiceStatus.PENDING,
              InvoiceStatus.PARTIAL,
              InvoiceStatus.OVERDUE,
            ],
          },
        },
        _sum: {
          balance: true,
        },
      }),
    ]);

    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        suspended: suspendedCustomers,
        expired: expiredCustomers,
      },
      routers: {
        total: totalRouters,
        active: activeRouters,
        inactive: totalRouters - activeRouters,
      },
      packages: {
        total: totalPackages,
        active: activePackages,
      },
      olt: {
        totalOlts,
        activeOlts,
        inactiveOlts: totalOlts - activeOlts,
        totalOnus,
        onlineOnus,
        offlineOnus: totalOnus - onlineOnus,
      },
      billing: {
        pendingInvoices,
        overdueInvoices,
        todayCollection: todayPayments._sum.amount || 0,
        monthlyCollection: monthlyPayments._sum.amount || 0,
        outstanding: outstandingInvoices._sum.balance || 0,
      },
    };
  }

  async recentPayments() {
    return this.prisma.payment.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            customerNo: true,
            fullName: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            status: true,
          },
        },
      },
    });
  }

  async recentCustomers() {
    return this.prisma.customer.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        package: true,
        router: {
          select: {
            id: true,
            name: true,
            host: true,
          },
        },
        pppAccount: true,
      },
    });
  }
}