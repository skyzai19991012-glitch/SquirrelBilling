import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeviceConnectionStatus } from '@prisma/client';
import * as net from 'net';
import {
  isSuperAdmin,
  tenantFilter,
  tenantIdForCreate,
} from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OltService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkOltLimit(user: any) {
    if (isSuperAdmin(user)) return;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) return;

    const count = await this.prisma.oltDevice.count({
      where: { tenantId: user.tenantId },
    });

    if (count >= tenant.maxOlts) {
      throw new BadRequestException(`OLT limit reached for plan ${tenant.planName}`);
    }
  }

  async oltSummary(user: any) {
    const [
      totalOlts,
      activeOlts,
      connectedOlts,
      failedOlts,
      notTestedOlts,
      totalOnus,
      onlineOnus,
      offlineOnus,
    ] = await Promise.all([
      this.prisma.oltDevice.count({
        where: tenantFilter(user),
      }),
      this.prisma.oltDevice.count({
        where: {
          ...tenantFilter(user),
          active: true,
        },
      }),
      this.prisma.oltDevice.count({
        where: {
          ...tenantFilter(user),
          connectionStatus: DeviceConnectionStatus.CONNECTED,
        },
      }),
      this.prisma.oltDevice.count({
        where: {
          ...tenantFilter(user),
          connectionStatus: DeviceConnectionStatus.FAILED,
        },
      }),
      this.prisma.oltDevice.count({
        where: {
          ...tenantFilter(user),
          connectionStatus: DeviceConnectionStatus.NOT_TESTED,
        },
      }),
      this.prisma.onuDevice.count({
        where: tenantFilter(user),
      }),
      this.prisma.onuDevice.count({
        where: {
          ...tenantFilter(user),
          online: true,
        },
      }),
      this.prisma.onuDevice.count({
        where: {
          ...tenantFilter(user),
          online: false,
        },
      }),
    ]);

    return {
      totalOlts,
      activeOlts,
      connectedOlts,
      failedOlts,
      notTestedOlts,
      totalOnus,
      onlineOnus,
      offlineOnus,
    };
  }

  async createOlt(user: any, dto: any) {
    await this.checkOltLimit(user);

    return this.prisma.oltDevice.create({
      data: {
        tenantId: tenantIdForCreate(user, dto.tenantId),
        name: dto.name,
        vendor: dto.vendor,
        host: dto.host,
        port: Number(dto.port || 22),
        username: dto.username,
        password: dto.password,
        active: dto.active ?? true,
        connectionStatus: DeviceConnectionStatus.NOT_TESTED,
      },
    });
  }

  async findAllOlts(user: any) {
    return this.prisma.oltDevice.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            onus: true,
          },
        },
      },
    });
  }

  async findOlt(user: any, id: string) {
    const olt = await this.prisma.oltDevice.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
      include: {
        onus: true,
        _count: {
          select: {
            onus: true,
          },
        },
      },
    });

    if (!olt) {
      throw new NotFoundException('OLT not found');
    }

    return olt;
  }

  async updateOlt(user: any, id: string, dto: any) {
    await this.findOlt(user, id);

    return this.prisma.oltDevice.update({
      where: { id },
      data: {
        name: dto.name,
        vendor: dto.vendor,
        host: dto.host,
        port: dto.port !== undefined ? Number(dto.port) : undefined,
        username: dto.username,
        password: dto.password,
        active: dto.active,
        connectionStatus: DeviceConnectionStatus.NOT_TESTED,
        lastTestedAt: null,
        lastError: null,
      },
    });
  }

  async removeOlt(user: any, id: string) {
    await this.findOlt(user, id);

    const onuCount = await this.prisma.onuDevice.count({
      where: {
        oltId: id,
        ...tenantFilter(user),
      },
    });

    if (onuCount > 0) {
      throw new BadRequestException('Cannot delete OLT with ONU devices');
    }

    return this.prisma.oltDevice.delete({
      where: { id },
    });
  }

  async createOnu(user: any, dto: any) {
    const tenantId = tenantIdForCreate(user, dto.tenantId);

    const olt = await this.prisma.oltDevice.findFirst({
      where: {
        id: dto.oltId,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!olt) {
      throw new BadRequestException('OLT not found for this tenant');
    }

    return this.prisma.onuDevice.create({
      data: {
        tenantId,
        oltId: dto.oltId,
        serialNumber: dto.serialNumber,
        ponPort: dto.ponPort,
        onuId: dto.onuId,
        vlan: dto.vlan !== undefined && dto.vlan !== '' ? Number(dto.vlan) : undefined,
        rxPower:
          dto.rxPower !== undefined && dto.rxPower !== ''
            ? Number(dto.rxPower)
            : undefined,
        txPower:
          dto.txPower !== undefined && dto.txPower !== ''
            ? Number(dto.txPower)
            : undefined,
        distance:
          dto.distance !== undefined && dto.distance !== ''
            ? Number(dto.distance)
            : undefined,
        online: dto.online ?? false,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
      },
      include: {
        olt: true,
      },
    });
  }

  async findAllOnus(user: any) {
    return this.prisma.onuDevice.findMany({
      where: tenantFilter(user),
      orderBy: { createdAt: 'desc' },
      include: {
        olt: true,
      },
    });
  }

  async findOnu(user: any, id: string) {
    const onu = await this.prisma.onuDevice.findFirst({
      where: {
        id,
        ...tenantFilter(user),
      },
      include: {
        olt: true,
      },
    });

    if (!onu) {
      throw new NotFoundException('ONU not found');
    }

    return onu;
  }

  async updateOnu(user: any, id: string, dto: any) {
    await this.findOnu(user, id);

    return this.prisma.onuDevice.update({
      where: { id },
      data: {
        serialNumber: dto.serialNumber,
        ponPort: dto.ponPort,
        onuId: dto.onuId,
        vlan: dto.vlan !== undefined && dto.vlan !== '' ? Number(dto.vlan) : undefined,
        rxPower:
          dto.rxPower !== undefined && dto.rxPower !== ''
            ? Number(dto.rxPower)
            : undefined,
        txPower:
          dto.txPower !== undefined && dto.txPower !== ''
            ? Number(dto.txPower)
            : undefined,
        distance:
          dto.distance !== undefined && dto.distance !== ''
            ? Number(dto.distance)
            : undefined,
        online: dto.online,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
      },
      include: {
        olt: true,
      },
    });
  }

  async removeOnu(user: any, id: string) {
    await this.findOnu(user, id);

    return this.prisma.onuDevice.delete({
      where: { id },
    });
  }

  async findOnusByOlt(user: any, id: string) {
    await this.findOlt(user, id);

    return this.prisma.onuDevice.findMany({
      where: {
        oltId: id,
        ...tenantFilter(user),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        olt: true,
      },
    });
  }

  private testTcpConnection(host: string, port: number, timeout = 8000): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();

      const done = (error?: Error) => {
        socket.removeAllListeners();
        socket.destroy();

        if (error) reject(error);
        else resolve();
      };

      socket.setTimeout(timeout);

      socket.once('connect', () => done());
      socket.once('timeout', () => done(new Error('Connection timeout')));
      socket.once('error', (error) => done(error));

      socket.connect(port, host);
    });
  }

  async testOltConnection(user: any, id: string) {
    const olt = await this.findOlt(user, id);

    try {
      await this.testTcpConnection(olt.host, olt.port);

      const updated = await this.prisma.oltDevice.update({
        where: { id },
        data: {
          connectionStatus: DeviceConnectionStatus.CONNECTED,
          lastTestedAt: new Date(),
          lastError: null,
        },
      });

      return {
        success: true,
        message: 'OLT port is reachable',
        olt: updated,
      };
    } catch (error: any) {
      const updated = await this.prisma.oltDevice.update({
        where: { id },
        data: {
          connectionStatus: DeviceConnectionStatus.FAILED,
          lastTestedAt: new Date(),
          lastError: error?.message || 'OLT connection failed',
        },
      });

      return {
        success: false,
        message: error?.message || 'OLT connection failed',
        olt: updated,
      };
    }
  }
}