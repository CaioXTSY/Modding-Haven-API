import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminController } from './admin.controller';
import { UsersService } from 'src/users/users.service';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [UsersService, AdminGuard],
})
export class AdminModule {}
