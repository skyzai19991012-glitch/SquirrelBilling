import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MikrotikService } from '../mikrotik/mikrotik.service';
import { CreateRouterDto } from './dto/create-router.dto';
import { UpdateRouterDto } from './dto/update-router.dto';

@Injectable()
export class RoutersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mikrotikService: MikrotikService,
  ) {}

  create(dto: CreateRouterDto) {
    return this.prisma.router.create({
      data: {
        name: dto.name,
        host: dto.host,
        apiPort: dto.apiPort,
        username: dto.username,
        password: dto.password,
        ssl: dto.ssl ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.router.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        host: true,
        apiPort: true,
        username: true,
        ssl: true,
        active: true,
        model: true,
        version: true,
        identity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const router = await this.prisma.router.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        host: true,
        apiPort: true,
        username: true,
        ssl: true,
        active: true,
        model: true,
        version: true,
        identity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!router) {
      throw new NotFoundException('Router not found');
    }

    return router;
  }

  async update(id: string, dto: UpdateRouterDto) {
    await this.findOne(id);

    return this.prisma.router.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        type: true,
        host: true,
        apiPort: true,
        username: true,
        ssl: true,
        active: true,
        model: true,
        version: true,
        identity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.router.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Router deleted successfully',
    };
  }

  async testConnection(id: string) {
    const router = await this.prisma.router.findUnique({
      where: { id },
    });

    if (!router) {
      throw new NotFoundException('Router not found');
    }

    const result = await this.mikrotikService.testTcpConnection(
      router.host,
      router.apiPort,
    );

    await this.prisma.router.update({
      where: { id },
      data: {
        active: result.success,
      },
    });

    return result;
  }
}