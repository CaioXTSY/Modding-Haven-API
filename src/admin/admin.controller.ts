import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UpdateUserRoleDto } from 'src/users/dto/update-user-role.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('users')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('users/:id')
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('users/:id')
  @ApiParam({ name: 'id', type: String })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch('users/:id/role')
  @ApiParam({ name: 'id', type: String })
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.update(id, { role: dto.role });
  }

  @Delete('users/:id')
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('mods/pending')
  async pendingMods() {
    const mods = await this.prisma.mod.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
      },
    });
    const thumbs = await Promise.all(
      mods.map((m) =>
        this.prisma.modImage
          .findFirst({
            where: { modId: m.id },
            orderBy: { createdAt: 'asc' },
            select: { path: true },
          })
          .then((img) => (img ? `/uploads/${img.path}` : null)),
      ),
    );
    return mods.map((m, idx) => ({ ...m, thumbnail: thumbs[idx] }));
  }

  @Post('mods/:id/approve')
  @ApiParam({ name: 'id', type: String })
  async approveMod(@Param('id') id: string) {
    const mod = await this.prisma.mod.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException();
    const screenshots = await this.prisma.modImage.count({
      where: { modId: id },
    });
    if (screenshots < 1)
      throw new ForbiddenException('Requires at least 1 screenshot');
    const versions = await this.prisma.modVersion.count({
      where: { modId: id },
    });
    if (versions < 1)
      throw new ForbiddenException('Requires at least 1 version');
    const files = await this.prisma.modVersionFile.count({
      where: { version: { modId: id } },
    });
    if (files < 1) throw new ForbiddenException('Requires at least 1 file');
    const updated = (await this.prisma.mod.update({
      where: { id },
      data: { status: 'APPROVED', rejectionReason: null },
      select: { id: true, status: true },
    })) as { id: string; status: 'APPROVED' | 'PENDING' | 'REJECTED' };
    return updated;
  }

  @Post('mods/:id/reject')
  @ApiParam({ name: 'id', type: String })
  async rejectMod(@Param('id') id: string, @Body() dto: { reason: string }) {
    const mod = await this.prisma.mod.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException();
    const updated = (await this.prisma.mod.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: dto.reason ?? 'No reason' },
      select: { id: true, status: true, rejectionReason: true },
    })) as {
      id: string;
      status: 'APPROVED' | 'PENDING' | 'REJECTED';
      rejectionReason: string | null;
    };
    return updated;
  }
}
