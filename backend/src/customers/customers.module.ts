import { Module } from '@nestjs/common';
import { MikrotikModule } from '../mikrotik/mikrotik.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [MikrotikModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}