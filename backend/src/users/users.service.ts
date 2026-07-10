import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  async createAdminUser() {
    return this.seedSuperAdmin();
  }

  async seedSuperAdmin() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const fullName = process.env.ADMIN_NAME || 'Super Administrator';

    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      if (existing.role !== UserRole.SUPER_ADMIN || existing.tenantId !== null) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            role: UserRole.SUPER_ADMIN,
            tenantId: null,
            active: true,
          },
        });
      }

      return existing;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        active: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tenant: true },
    });
  }

  async findOne(id: string) {
    return this.findById(id);
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { tenant: true },
    });
  }
}