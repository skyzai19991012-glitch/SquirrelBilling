import { MikrotikService } from '../mikrotik/mikrotik.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly mikrotikService: MikrotikService,
) {}
  async create(dto: CreateCustomerDto) {
    const router = await this.prisma.router.findUnique({
      where: { id: dto.routerId },
    });

    if (!router) {
      throw new NotFoundException('Router not found');
    }

    const pkg = await this.prisma.internetPackage.findUnique({
      where: { id: dto.packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { customerNo: dto.customerNo },
          { pppAccount: { username: dto.username } },
        ],
      },
    });

    if (existingCustomer) {
      throw new ConflictException('Customer number or PPP username already exists');
    }

    return this.prisma.customer.create({
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
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes,
        pppAccount: {
          create: {
            routerId: dto.routerId,
            username: dto.username,
            password: dto.password,
            profile: dto.profile,
            service: dto.service || 'pppoe',
            localIp: dto.localIp,
            remoteIp: dto.remoteIp,
            callerId: dto.callerId,
          },
        },
      },
      include: {
        router: true,
        package: true,
        pppAccount: true,
      },
    });
  }

  findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        router: {
          select: {
            id: true,
            name: true,
            host: true,
          },
        },
        package: true,
        pppAccount: true,
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
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

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    const customerData: any = {};
    const pppData: any = {};

    const customerFields = [
      'fullName',
      'fatherName',
      'cnic',
      'phone',
      'whatsapp',
      'email',
      'address',
      'gpsLocation',
      'routerId',
      'packageId',
      'notes',
    ];

    for (const field of customerFields) {
      if (dto[field] !== undefined) {
        customerData[field] = dto[field];
      }
    }

    if (dto.dueDate !== undefined) {
      customerData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    const pppFields = [
      'username',
      'password',
      'profile',
      'localIp',
      'remoteIp',
      'callerId',
    ];

    for (const field of pppFields) {
      if (dto[field] !== undefined) {
        pppData[field] = dto[field];
      }
    }

    if (dto.routerId !== undefined) {
      pppData.routerId = dto.routerId;
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...customerData,
        pppAccount:
          Object.keys(pppData).length > 0
            ? {
                update: pppData,
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

   async suspend(id: string) {
    const customer = await this.findOne(id);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        pppAccount: {
          update: {
            disabled: true,
          },
        },
      },
      include: {
        pppAccount: true,
      },
    });

    let routerSync: any = null;

    if (customer.pppAccount) {
      routerSync = await this.mikrotikService
        .disablePppSecret(customer.routerId, customer.pppAccount.username)
        .catch((error) => ({
          success: false,
          message: error.message,
        }));
    }

    return {
      success: true,
      customer: updated,
      routerSync,
    };
  }

    async activate(id: string) {
    const customer = await this.findOne(id);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        pppAccount: {
          update: {
            disabled: false,
          },
        },
      },
      include: {
        pppAccount: true,
      },
    });

    let routerSync: any = null;

    if (customer.pppAccount) {
      routerSync = await this.mikrotikService
        .enablePppSecret(customer.routerId, customer.pppAccount.username)
        .catch((error) => ({
          success: false,
          message: error.message,
        }));
    }

    return {
      success: true,
      customer: updated,
      routerSync,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.pppAccount.deleteMany({
      where: { customerId: id },
    });

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Customer deleted successfully',
    };
  }
}