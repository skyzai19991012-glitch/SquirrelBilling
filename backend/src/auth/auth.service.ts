import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async checkPassword(inputPassword: string, storedPassword: string) {
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
      return bcrypt.compare(inputPassword, storedPassword);
    }

    return inputPassword === storedPassword;
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordOk = await this.checkPassword(dto.password, user.password);

    if (!passwordOk) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.active) {
      throw new ForbiddenException('User account is disabled');
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.tenantId || !user.tenant) {
        throw new ForbiddenException('Tenant account missing');
      }

      if (user.tenant.status !== TenantStatus.ACTIVE) {
        throw new ForbiddenException('Tenant account is not active');
      }

      if (
        user.tenant.subscriptionEnd &&
        user.tenant.subscriptionEnd.getTime() < Date.now()
      ) {
        await this.prisma.tenant.update({
          where: { id: user.tenant.id },
          data: { status: TenantStatus.EXPIRED },
        });

        throw new ForbiddenException('Subscription expired');
      }
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant
          ? {
              id: user.tenant.id,
              name: user.tenant.name,
              companyName: user.tenant.companyName,
              status: user.tenant.status,
              planName: user.tenant.planName,
              subscriptionEnd: user.tenant.subscriptionEnd,
            }
          : null,
      },
    };
  }

  async me(user: any) {
    const found = await this.prisma.user.findUnique({
      where: { id: user.id || user.userId },
      include: { tenant: true },
    });

    if (!found) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: found.id,
      fullName: found.fullName,
      username: found.username,
      role: found.role,
      tenantId: found.tenantId,
      active: found.active,
      tenant: found.tenant,
    };
  }
}