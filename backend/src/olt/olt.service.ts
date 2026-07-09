import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as net from 'net';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOltDto } from './dto/create-olt.dto';
import { UpdateOltDto } from './dto/update-olt.dto';
import { CreateOnuDto } from './dto/create-onu.dto';
import { UpdateOnuDto } from './dto/update-onu.dto';

@Injectable()
export class OltService {
  constructor(private readonly prisma: PrismaService) {}

  createOlt(dto: CreateOltDto) {
    return this.prisma.oltDevice.create({
      data: {
        name: dto.name,
        vendor: dto.vendor,
        host: dto.host,
        port: dto.port,
        username: dto.username,
        password: dto.password,
        active: dto.active ?? true,
      },
    });
  }

  findAllOlts() {
    return this.prisma.oltDevice.findMany({
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

  async findOlt(id: string) {
    const olt = await this.prisma.oltDevice.findUnique({
      where: { id },
      include: {
        onus: true,
      },
    });

    if (!olt) {
      throw new NotFoundException('OLT not found');
    }

    return olt;
  }

  async updateOlt(id: string, dto: UpdateOltDto) {
    await this.findOlt(id);

    return this.prisma.oltDevice.update({
      where: { id },
      data: dto,
    });
  }

  async removeOlt(id: string) {
    await this.findOlt(id);

    await this.prisma.onuDevice.deleteMany({
      where: { oltId: id },
    });

    await this.prisma.oltDevice.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'OLT deleted successfully',
    };
  }

  async testOltConnection(id: string) {
    const olt = await this.prisma.oltDevice.findUnique({
      where: { id },
    });

    if (!olt) {
      throw new NotFoundException('OLT not found');
    }

    const result = await new Promise<{ success: boolean; message: string }>(
      (resolve) => {
        const socket = new net.Socket();

        const done = (success: boolean, message: string) => {
          socket.destroy();
          resolve({ success, message });
        };

        socket.setTimeout(5000);

        socket.once('connect', () => {
          done(true, `Connected to OLT at ${olt.host}:${olt.port}`);
        });

        socket.once('timeout', () => {
          done(false, `Connection timeout to ${olt.host}:${olt.port}`);
        });

        socket.once('error', (error) => {
          done(false, error.message);
        });

        socket.connect(olt.port, olt.host);
      },
    );

    await this.prisma.oltDevice.update({
      where: { id },
      data: {
        active: result.success,
      },
    });

    return result;
  }

  async createOnu(dto: CreateOnuDto) {
    const olt = await this.prisma.oltDevice.findUnique({
      where: { id: dto.oltId },
    });

    if (!olt) {
      throw new NotFoundException('OLT not found');
    }

    const existing = await this.prisma.onuDevice.findUnique({
      where: { serialNumber: dto.serialNumber },
    });

    if (existing) {
      throw new ConflictException('ONU serial number already exists');
    }

    return this.prisma.onuDevice.create({
      data: {
        oltId: dto.oltId,
        serialNumber: dto.serialNumber,
        ponPort: dto.ponPort,
        onuId: dto.onuId,
        vlan: dto.vlan,
        rxPower: dto.rxPower,
        txPower: dto.txPower,
        distance: dto.distance,
        online: dto.online ?? false,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
      },
      include: {
        olt: true,
      },
    });
  }

  findAllOnus() {
    return this.prisma.onuDevice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        olt: true,
      },
    });
  }

  async findOnusByOlt(oltId: string) {
    await this.findOlt(oltId);

    return this.prisma.onuDevice.findMany({
      where: { oltId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnu(id: string) {
    const onu = await this.prisma.onuDevice.findUnique({
      where: { id },
      include: {
        olt: true,
      },
    });

    if (!onu) {
      throw new NotFoundException('ONU not found');
    }

    return onu;
  }

  async updateOnu(id: string, dto: UpdateOnuDto) {
    await this.findOnu(id);

    return this.prisma.onuDevice.update({
      where: { id },
      data: dto,
      include: {
        olt: true,
      },
    });
  }

  async removeOnu(id: string) {
    await this.findOnu(id);

    await this.prisma.onuDevice.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'ONU deleted successfully',
    };
  }

  async oltSummary() {
    const totalOlts = await this.prisma.oltDevice.count();
    const activeOlts = await this.prisma.oltDevice.count({
      where: { active: true },
    });

    const totalOnus = await this.prisma.onuDevice.count();
    const onlineOnus = await this.prisma.onuDevice.count({
      where: { online: true },
    });

    return {
      totalOlts,
      activeOlts,
      inactiveOlts: totalOlts - activeOlts,
      totalOnus,
      onlineOnus,
      offlineOnus: totalOnus - onlineOnus,
    };
  }
}