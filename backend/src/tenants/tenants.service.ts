import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
            active: true,
          },
        },
        _count: {
          select: {
            customers: true,
            routers: true,
            olts: true,
            invoices: true,
            payments: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        _count: {
          select: {
            customers: true,
            routers: true,
            olts: true,
            invoices: true,
            payments: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async create(dto: any) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { name: dto.name },
    });

    if (existingTenant) {
      throw new BadRequestException('Tenant name already exists');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.adminUsername },
    });

    if (existingUser) {
      throw new BadRequestException('Admin username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.adminPassword || 'admin123', 10);

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        companyName: dto.companyName || dto.name,
        ownerName: dto.ownerName || dto.adminFullName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        status: dto.status || TenantStatus.ACTIVE,
        planName: dto.planName || 'STARTER',
        monthlyPrice: Number(dto.monthlyPrice || 0),
        maxCustomers: Number(dto.maxCustomers || 300),
        maxRouters: Number(dto.maxRouters || 1),
        maxOlts: Number(dto.maxOlts || 1),
        subscriptionEnd: dto.subscriptionEnd ? new Date(dto.subscriptionEnd) : null,
        users: {
          create: {
            fullName: dto.adminFullName || 'Tenant Admin',
            username: dto.adminUsername,
            password: hashedPassword,
            role: UserRole.ADMIN,
            active: true,
          },
        },
      },
      include: {
        users: true,
      },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name,
        companyName: dto.companyName,
        ownerName: dto.ownerName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        status: dto.status,
        planName: dto.planName,
        monthlyPrice:
          dto.monthlyPrice !== undefined ? Number(dto.monthlyPrice) : undefined,
        maxCustomers:
          dto.maxCustomers !== undefined ? Number(dto.maxCustomers) : undefined,
        maxRouters:
          dto.maxRouters !== undefined ? Number(dto.maxRouters) : undefined,
        maxOlts: dto.maxOlts !== undefined ? Number(dto.maxOlts) : undefined,
        subscriptionEnd:
          dto.subscriptionEnd !== undefined && dto.subscriptionEnd !== ''
            ? new Date(dto.subscriptionEnd)
            : dto.subscriptionEnd === ''
              ? null
              : undefined,
      },
    });
  }

  async remove(id: string) {
    const tenant = await this.findOne(id);

    if (tenant._count.customers > 0 || tenant._count.routers > 0 || tenant._count.olts > 0) {
      throw new BadRequestException(
        'Cannot delete tenant with data. Suspend it instead or delete tenant data first.',
      );
    }

    await this.prisma.user.deleteMany({
      where: { tenantId: id },
    });

    await this.prisma.tenant.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Tenant deleted',
    };
  }

  async activate(id: string) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
    });
  }

  async suspend(id: string) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED },
    });
  }
}