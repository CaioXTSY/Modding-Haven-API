import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async update(id: string, dto: { username?: string; email?: string; role?: 'USER' | 'ADMIN' }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.username ? { username: dto.username } : {}),
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.role ? { role: dto.role } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
