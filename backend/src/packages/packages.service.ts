import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { tenantFilter, tenantIdForCreate } from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: any, dto: any) {
    return this.prisma.internetPackage.create({
      data: {
        tenantId: tenantIdForCreate(user, dto.tenantId),
        name: dto.name,
        downloadMbps: Number(dto.downloadMbps),
        uploadMbps: Number(dto.uploadMbps),
        price: Number(dto.price),
        mikrotikProfile: dto.mikrotikProfile || dto.name,
        active: dto.active ?? true,
      },
    });
  }

  async findAll(user: any) {
    return this.prisma.internetPackage.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });
  }

  async findOne(user: any, id: string) {
    const item = await this.prisma.internetPackage.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Package not found');
    }

    return item;
  }

  async update(user: any, id: string, dto: any) {
    await this.findOne(user, id);

    return this.prisma.internetPackage.update({
      where: { id },
      data: {
        name: dto.name,
        downloadMbps:
          dto.downloadMbps !== undefined ? Number(dto.downloadMbps) : undefined,
        uploadMbps:
          dto.uploadMbps !== undefined ? Number(dto.uploadMbps) : undefined,
        price: dto.price !== undefined ? Number(dto.price) : undefined,
        mikrotikProfile: dto.mikrotikProfile,
        active: dto.active,
      },
    });
  }

  async remove(user: any, id: string) {
    await this.findOne(user, id);

    const customerCount = await this.prisma.customer.count({
      where: {
        packageId: id,
        ...tenantFilter(user),
      },
    });

    if (customerCount > 0) {
      throw new BadRequestException('Cannot delete package with customers');
    }

    return this.prisma.internetPackage.delete({
      where: { id },
    });
  }
}