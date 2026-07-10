import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeviceConnectionStatus, RouterType } from '@prisma/client';
import * as net from 'net';
import * as tls from 'tls';
import {
  isSuperAdmin,
  tenantFilter,
  tenantIdForCreate,
} from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoutersService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkRouterLimit(user: any, dtoTenantId?: string | null) {
    const tenantId = isSuperAdmin(user) ? dtoTenantId : user?.tenantId;

    if (!tenantId) {
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const count = await this.prisma.router.count({
      where: { tenantId },
    });

    if (count >= tenant.maxRouters) {
      throw new BadRequestException(`Router limit reached for plan ${tenant.planName}`);
    }
  }

  async create(user: any, dto: any) {
    await this.checkRouterLimit(user, dto.tenantId);

    return this.prisma.router.create({
      data: {
        tenantId: tenantIdForCreate(user, dto.tenantId),
        name: dto.name,
        type: dto.type || RouterType.MIKROTIK,
        host: dto.host,
        apiPort: Number(dto.apiPort || dto.port || 8729),
        username: dto.username,
        password: dto.password,
        ssl: dto.ssl ?? true,
        active: dto.active ?? true,
        connectionStatus: DeviceConnectionStatus.NOT_TESTED,
      },
    });
  }

  async findAll(user: any) {
    return this.prisma.router.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            customers: true,
            pppAccounts: true,
          },
        },
      },
    });
  }

  async findOne(user: any, id: string) {
    const router = await this.prisma.router.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
      include: {
        _count: {
          select: {
            customers: true,
            pppAccounts: true,
          },
        },
      },
    });

    if (!router) {
      throw new NotFoundException('Router not found');
    }

    return router;
  }

  async update(user: any, id: string, dto: any) {
    await this.findOne(user, id);

    return this.prisma.router.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        host: dto.host,
        apiPort:
          dto.apiPort !== undefined
            ? Number(dto.apiPort)
            : dto.port !== undefined
              ? Number(dto.port)
              : undefined,
        username: dto.username,
        password: dto.password,
        ssl: dto.ssl,
        active: dto.active,
        connectionStatus: DeviceConnectionStatus.NOT_TESTED,
        lastTestedAt: null,
        lastError: null,
      },
    });
  }

  async remove(user: any, id: string) {
    await this.findOne(user, id);

    const customerCount = await this.prisma.customer.count({
      where: {
        routerId: id,
        ...tenantFilter(user),
      },
    });

    if (customerCount > 0) {
      throw new BadRequestException('Cannot delete router with customers');
    }

    await this.prisma.pppAccount.deleteMany({
      where: {
        routerId: id,
        ...tenantFilter(user),
      },
    });

    return this.prisma.router.delete({
      where: { id },
    });
  }

  private testTcpConnection(router: any, timeout = 8000): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = Number(router.apiPort || 8729);

      const socket = router.ssl
        ? tls.connect({
            host: router.host,
            port,
            rejectUnauthorized: false,
            servername: router.host,
          })
        : net.connect({
            host: router.host,
            port,
          });

      const done = (error?: Error) => {
        socket.removeAllListeners();
        socket.destroy();

        if (error) reject(error);
        else resolve();
      };

      socket.setTimeout(timeout);

      socket.once(router.ssl ? 'secureConnect' : 'connect', () => done());
      socket.once('timeout', () => done(new Error('Connection timeout')));
      socket.once('error', (error) => done(error));
    });
  }

  async testRouterConnection(user: any, id: string) {
    const router = await this.findOne(user, id);

    try {
      await this.testTcpConnection(router);

      const updated = await this.prisma.router.update({
        where: { id },
        data: {
          connectionStatus: DeviceConnectionStatus.CONNECTED,
          lastTestedAt: new Date(),
          lastError: null,
        },
      });

      return {
        success: true,
        message: 'Router API port is reachable',
        router: updated,
      };
    } catch (error: any) {
      const updated = await this.prisma.router.update({
        where: { id },
        data: {
          connectionStatus: DeviceConnectionStatus.FAILED,
          lastTestedAt: new Date(),
          lastError: error?.message || 'Router connection failed',
        },
      });

      return {
        success: false,
        message: error?.message || 'Router connection failed',
        router: updated,
      };
    }
  }
}