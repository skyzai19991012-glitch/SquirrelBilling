import { TenantsModule } from './tenants/tenants.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { RoutersModule } from './routers/routers.module';
import { MikrotikModule } from './mikrotik/mikrotik.module';
import { PackagesModule } from './packages/packages.module';
import { CustomersModule } from './customers/customers.module';
import { BillingModule } from './billing/billing.module';
import { OltModule } from './olt/olt.module';
import { DashboardModule } from './dashboard/dashboard.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MikrotikModule,
    RoutersModule,
    PackagesModule,
    CustomersModule,
    BillingModule,
    OltModule,
    DashboardModule,
    TenantsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}