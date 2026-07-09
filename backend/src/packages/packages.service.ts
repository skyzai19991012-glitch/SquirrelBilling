import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePackageDto) {
    return this.prisma.internetPackage.create({
      data: {
        name: dto.name,
        downloadMbps: dto.downloadMbps,
        uploadMbps: dto.uploadMbps,
        price: dto.price,
        mikrotikProfile: dto.mikrotikProfile,
        active: dto.active ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.internetPackage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.internetPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);

    return this.prisma.internetPackage.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.internetPackage.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Package deleted successfully',
    };
  }
}