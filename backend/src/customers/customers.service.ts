import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomerStatus } from '@prisma/client';
import {
  isSuperAdmin,
  tenantFilter,
  tenantIdForCreate,
} from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkCustomerLimit(user: any) {
    if (isSuperAdmin(user)) return;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) return;

    const count = await this.prisma.customer.count({
      where: { tenantId: user.tenantId },
    });

    if (count >= tenant.maxCustomers) {
      throw new BadRequestException(`Customer limit reached for plan ${tenant.planName}`);
    }
  }

  async create(user: any, dto: any) {
    await this.checkCustomerLimit(user);

    const tenantId = tenantIdForCreate(user, dto.tenantId);

    const router = await this.prisma.router.findFirst({
      where: {
        id: dto.routerId,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!router) {
      throw new BadRequestException('Router not found for this tenant');
    }

    const internetPackage = await this.prisma.internetPackage.findFirst({
      where: {
        id: dto.packageId,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!internetPackage) {
      throw new BadRequestException('Package not found for this tenant');
    }

    const pppUsername =
      dto.pppUsername || dto.username || dto.pppAccount?.username || null;

    const pppPassword =
      dto.pppPassword || dto.pppPasswordText || dto.pppAccount?.password || '123456';

    const pppProfile =
      dto.pppProfile ||
      dto.profile ||
      dto.pppAccount?.profile ||
      internetPackage.mikrotikProfile;

    return this.prisma.customer.create({
      data: {
        tenantId,
        customerNo: dto.customerNo,
        fullName: dto.fullName,
        fatherName: dto.fatherName,
        cnic: dto.cnic,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        address: dto.address,
        gpsLocation: dto.gpsLocation,
        routerId: dto.routerId,
        packageId: dto.packageId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        status: dto.status || CustomerStatus.ACTIVE,
        pppAccount: pppUsername
          ? {
              create: {
                tenantId,
                routerId: dto.routerId,
                username: pppUsername,
                password: pppPassword,
                profile: pppProfile,
                service: dto.service || 'pppoe',
                localIp: dto.localIp,
                remoteIp: dto.remoteIp,
                callerId: dto.callerId,
                disabled: false,
              },
            }
          : undefined,
      },
      include: {
        router: true,
        package: true,
        pppAccount: true,
      },
    });
  }

  async findAll(user: any) {
    return this.prisma.customer.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      include: {
        router: true,
        package: true,
        pppAccount: true,
      },
    });
  }

  async findOne(user: any, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
      include: {
        router: true,
        package: true,
        pppAccount: true,
        invoices: true,
        payments: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(user: any, id: string, dto: any) {
    await this.findOne(user, id);

    return this.prisma.customer.update({
      where: { id },
      data: {
        customerNo: dto.customerNo,
        fullName: dto.fullName,
        fatherName: dto.fatherName,
        cnic: dto.cnic,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        address: dto.address,
        gpsLocation: dto.gpsLocation,
        routerId: dto.routerId,
        packageId: dto.packageId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        status: dto.status,
      },
      include: {
        router: true,
        package: true,
        pppAccount: true,
      },
    });
  }

  async remove(user: any, id: string) {
    await this.findOne(user, id);

    await this.prisma.$transaction([
      this.prisma.payment.deleteMany({
        where: {
          customerId: id,
          ...tenantFilter(user),
        },
      }),
      this.prisma.invoice.deleteMany({
        where: {
          customerId: id,
          ...tenantFilter(user),
        },
      }),
      this.prisma.pppAccount.deleteMany({
        where: {
          customerId: id,
          ...tenantFilter(user),
        },
      }),
      this.prisma.customer.delete({
        where: { id },
      }),
    ]);

    return {
      success: true,
      message: 'Customer deleted',
    };
  }

  async suspend(user: any, id: string) {
    await this.findOne(user, id);

    await this.prisma.pppAccount.updateMany({
      where: {
        customerId: id,
        ...tenantFilter(user),
      },
      data: {
        disabled: true,
      },
    });

    return this.prisma.customer.update({
      where: { id },
      data: {
        status: CustomerStatus.SUSPENDED,
      },
      include: {
        router: true,
        package: true,
        pppAccount: true,
      },
    });
  }

  async activate(user: any, id: string) {
    await this.findOne(user, id);

    await this.prisma.pppAccount.updateMany({
      where: {
        customerId: id,
        ...tenantFilter(user),
      },
      data: {
        disabled: false,
      },
    });

    return this.prisma.customer.update({
      where: { id },
      data: {
        status: CustomerStatus.ACTIVE,
      },
      include: {
        router: true,
        package: true,
        pppAccount: true,
      },
    });
  }
}