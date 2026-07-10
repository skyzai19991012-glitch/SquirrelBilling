import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomerStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
import { tenantFilter, tenantIdForCreate } from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInvoiceNo() {
    return `INV-${Date.now()}`;
  }

  private normalizeMethod(method: string): PaymentMethod {
    if (method === 'BANK_TRANSFER') return PaymentMethod.BANK;
    if (method && Object.values(PaymentMethod).includes(method as PaymentMethod)) {
      return method as PaymentMethod;
    }

    return PaymentMethod.CASH;
  }

  private async recalcInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) return null;

    const payments = await this.prisma.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });

    const paidAmount = payments._sum.amount || 0;
    const balance = Math.max(Number(invoice.amount) - paidAmount, 0);

    let status: InvoiceStatus = InvoiceStatus.PENDING;

    if (paidAmount >= invoice.amount) {
      status = InvoiceStatus.PAID;
    } else if (paidAmount > 0) {
      status = InvoiceStatus.PARTIAL;
    } else if (invoice.dueDate < new Date()) {
      status = InvoiceStatus.OVERDUE;
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount,
        balance,
        status,
      },
    });
  }

  async findInvoices(user: any) {
    return this.prisma.invoice.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: {
            router: true,
            package: true,
            pppAccount: true,
          },
        },
        payments: true,
      },
    });
  }

  async createInvoice(user: any, dto: any) {
    const tenantId = tenantIdForCreate(user, dto.tenantId);

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found for this tenant');
    }

    const amount = Number(dto.amount);
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.invoice.create({
      data: {
        tenantId,
        invoiceNo: dto.invoiceNo || this.generateInvoiceNo(),
        customerId: dto.customerId,
        amount,
        paidAmount: 0,
        balance: amount,
        status: InvoiceStatus.PENDING,
        dueDate,
      },
      include: {
        customer: true,
      },
    });
  }

    async updateInvoice(user: any, id: string, dto: any) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        amount: dto.amount !== undefined ? Number(dto.amount) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
      },
    });

    await this.recalcInvoice(id);

    return updated;
  }

  async deleteInvoice(user: any, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.prisma.payment.deleteMany({
      where: {
        invoiceId: id,
        ...tenantFilter(user),
      },
    });

    await this.prisma.invoice.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Invoice deleted',
    };
  }

  async findPayments(user: any) {
    return this.prisma.payment.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        invoice: true,
      },
    });
  }

  async createPayment(user: any, dto: any) {
    const tenantId = tenantIdForCreate(user, dto.tenantId);

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found for this tenant');
    }

    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id: dto.invoiceId,
          ...(tenantId ? { tenantId } : {}),
        },
      });

      if (!invoice) {
        throw new BadRequestException('Invoice not found for this tenant');
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        invoiceId: dto.invoiceId || undefined,
        amount: Number(dto.amount),
        method: this.normalizeMethod(dto.method),
        reference: dto.reference || dto.referenceNo,
        notes: dto.notes,
      },
      include: {
        customer: true,
        invoice: true,
      },
    });

    if (dto.invoiceId) {
      await this.recalcInvoice(dto.invoiceId);
    }

    return payment;
  }

    async updatePayment(user: any, id: string, dto: any) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        amount: dto.amount !== undefined ? Number(dto.amount) : undefined,
        method: dto.method ? this.normalizeMethod(dto.method) : undefined,
        reference: dto.reference || dto.referenceNo,
        notes: dto.notes,
      },
    });

    if (payment.invoiceId) {
      await this.recalcInvoice(payment.invoiceId);
    }

    return updated;
  }

  async deletePayment(user: any, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.payment.delete({
      where: { id },
    });

    if (payment.invoiceId) {
      await this.recalcInvoice(payment.invoiceId);
    }

    return {
      success: true,
      message: 'Payment deleted',
    };
  }

  async summary(user: any) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayCollection, monthlyCollection, outstanding] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          ...tenantFilter(user),
          createdAt: { gte: todayStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...tenantFilter(user),
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...tenantFilter(user),
          status: {
            in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
          },
        },
        _sum: { balance: true },
      }),
    ]);

    return {
      todayCollection: todayCollection._sum.amount || 0,
      monthlyCollection: monthlyCollection._sum.amount || 0,
      outstanding: outstanding._sum.balance || 0,
    };
  }

  async runExpiry(user: any) {
    const expired = await this.prisma.customer.findMany({
      where: {
        ...tenantFilter(user),
        status: CustomerStatus.ACTIVE,
        dueDate: {
          lte: new Date(),
        },
      },
    });

    for (const customer of expired) {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { status: CustomerStatus.EXPIRED },
      });

      await this.prisma.pppAccount.updateMany({
        where: {
          customerId: customer.id,
          tenantId: customer.tenantId,
        },
        data: {
          disabled: true,
        },
      });
    }

    return {
      success: true,
      expiredCount: expired.length,
    };
  }

  async expireDueCustomers() {
    return this.runExpiry({
      role: 'SUPER_ADMIN',
      tenantId: null,
    });
  }
}