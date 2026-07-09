import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersSeeder } from './users.seeder';

@Module({
  providers: [UsersService, UsersSeeder],
  exports: [UsersService],
})
export class UsersModule {}