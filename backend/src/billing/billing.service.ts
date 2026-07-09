import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, type Invoice } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInvoiceNo() {
    const now = new Date();
    return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Date.now()}`;
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : customer.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.invoice.create({
      data: {
        invoiceNo: this.generateInvoiceNo(),
        customerId: dto.customerId,
        amount: dto.amount,
        paidAmount: 0,
        balance: dto.amount,
        dueDate,
        status: InvoiceStatus.PENDING,
      },
      include: {
        customer: true,
      },
    });
  }

  findInvoices() {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        payments: true,
      },
    });
  }

  async findInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async recordPayment(dto: CreatePaymentDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    let invoice: Invoice | null = null;

    if (dto.invoiceId) {
      invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.customerId !== dto.customerId) {
        throw new BadRequestException('Invoice does not belong to this customer');
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        customerId: dto.customerId,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.method || PaymentMethod.CASH,
        reference: dto.reference,
        notes: dto.notes,
      },
    });

    if (invoice) {
      const paidAmount = invoice.paidAmount + dto.amount;
      const balance = Math.max(invoice.amount - paidAmount, 0);

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount,
          balance,
          status:
            balance <= 0
              ? InvoiceStatus.PAID
              : paidAmount > 0
                ? InvoiceStatus.PARTIAL
                : InvoiceStatus.PENDING,
        },
      });
    }

    if (dto.extendDays) {
      const baseDate =
        customer.dueDate && customer.dueDate > new Date()
          ? customer.dueDate
          : new Date();

      const newDueDate = new Date(baseDate);
      newDueDate.setDate(newDueDate.getDate() + dto.extendDays);

      await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          dueDate: newDueDate,
          status: 'ACTIVE',
          pppAccount: {
            update: {
              disabled: false,
            },
          },
        },
      });
    }

    return {
      success: true,
      payment,
    };
  }

  findPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        invoice: true,
      },
    });
  }

  async summary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const todayPayments = await this.prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const monthlyPayments = await this.prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const outstanding = await this.prisma.invoice.aggregate({
      where: {
        status: {
          in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
        },
      },
      _sum: {
        balance: true,
      },
    });

    const overdueCount = await this.prisma.invoice.count({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL],
        },
      },
    });

    return {
      todayCollection: todayPayments._sum.amount || 0,
      monthlyCollection: monthlyPayments._sum.amount || 0,
      outstanding: outstanding._sum.balance || 0,
      overdueInvoices: overdueCount,
    };
  }
}