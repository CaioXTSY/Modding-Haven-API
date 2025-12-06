import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ModsController } from './mods.controller';
import { ModsService } from './mods.service';

@Module({
  imports: [PrismaModule],
  controllers: [ModsController],
  providers: [ModsService],
})
export class ModsModule {}
