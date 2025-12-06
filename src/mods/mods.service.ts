import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { AuthUser } from 'src/auth/decorators/get-user.decorator';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class ModsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateUniqueSlug(base: string) {
    let slug = slugify(base);
    let i = 1;
    while (await this.prisma.mod.findUnique({ where: { slug } })) {
      i++;
      slug = `${slugify(base)}-${i}`;
    }
    return slug;
  }

  async create(user: AuthUser, dto: { name: string; description?: string; categories?: string[] }) {
    const slug = await this.generateUniqueSlug(dto.name);
    const categories = dto.categories?.length
      ? await this.prisma.category.findMany({ where: { slug: { in: dto.categories.map((s) => s.toLowerCase()) } } })
      : [];
    return this.prisma.mod.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        status: 'PENDING',
        authorId: user.id,
        categories: categories.length ? { connect: categories.map((c) => ({ id: c.id })) } : undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        authorId: true,
        categories: { select: { id: true, name: true, slug: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async list(user?: AuthUser) {
    const isAdmin = user?.role === 'ADMIN';
    return this.prisma.mod.findMany({
      where: isAdmin ? {} : { status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        authorId: true,
        categories: { select: { id: true, name: true, slug: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bySlug(slug: string, user?: AuthUser) {
    const mod = await this.prisma.mod.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        authorId: true,
        categories: { select: { id: true, name: true, slug: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!mod) throw new NotFoundException();
    const isAdmin = user?.role === 'ADMIN';
    if (!isAdmin && mod.status !== 'APPROVED') throw new NotFoundException();
    return mod;
  }

  async update(slug: string, user: AuthUser, dto: { name?: string; description?: string; categories?: string[]; status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
    const mod = await this.prisma.mod.findUnique({ where: { slug } });
    if (!mod) throw new NotFoundException();
    const isAdmin = user.role === 'ADMIN';
    const isAuthor = mod.authorId === user.id;
    if (!isAdmin && !isAuthor) throw new ForbiddenException();

    // Only admin can change status
    const status = isAdmin ? dto.status : undefined;

    const categories = dto.categories?.length
      ? await this.prisma.category.findMany({ where: { slug: { in: dto.categories.map((s) => s.toLowerCase()) } } })
      : undefined;

    const updated = await this.prisma.mod.update({
      where: { slug },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(status ? { status } : {}),
        ...(categories ? { categories: { set: [], connect: categories.map((c) => ({ id: c.id })) } } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        authorId: true,
        categories: { select: { id: true, name: true, slug: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async remove(slug: string, user: AuthUser) {
    const mod = await this.prisma.mod.findUnique({ where: { slug } });
    if (!mod) throw new NotFoundException();
    const isAdmin = user.role === 'ADMIN';
    const isAuthor = mod.authorId === user.id;
    if (!isAdmin && !isAuthor) throw new ForbiddenException();
    await this.prisma.mod.delete({ where: { slug } });
    return { deleted: true };
  }
}
