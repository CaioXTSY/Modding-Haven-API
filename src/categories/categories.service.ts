import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: { name: string; slug: string }) {
    return this.prisma.category.create({
      data: { name: dto.name, slug: dto.slug.toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: { name?: string; slug?: string }) {
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug.toLowerCase() } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return category;
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
