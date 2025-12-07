import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import type { AuthUser } from 'src/auth/decorators/get-user.decorator';
import type { Prisma } from '@prisma/client';

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

  async create(
    user: AuthUser,
    dto: { name: string; description?: string; categories?: string[] },
  ) {
    const slug = await this.generateUniqueSlug(dto.name);
    const categories = dto.categories?.length
      ? await this.prisma.category.findMany({
          where: { slug: { in: dto.categories.map((s) => s.toLowerCase()) } },
        })
      : [];
    const created = await this.prisma.mod.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        status: 'PENDING',
        authorId: user.id,
        categories: categories.length
          ? { connect: categories.map((c) => ({ id: c.id })) }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        authorId: true,
        categories: { select: { id: true, name: true, slug: true } },
        images: {
          select: {
            id: true,
            filename: true,
            mime: true,
            size: true,
            path: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      ...created,
      images: created.images.map((i) => ({ ...i, url: `/uploads/${i.path}` })),
    };
  }

  async list(
    user?: AuthUser,
    opts?: {
      page: number;
      limit: number;
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
      category?: string;
    },
  ) {
    const isAdmin = user?.role === 'ADMIN';
    const where: Prisma.ModWhereInput = {};
    if (!isAdmin) where.status = 'APPROVED';
    else if (opts?.status) where.status = opts.status;
    if (opts?.category) where.categories = { some: { slug: opts.category } };

    const [items, total] = await Promise.all([
      this.prisma.mod.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          status: true,
          authorId: true,
          categories: { select: { id: true, name: true, slug: true } },
          images: {
            select: {
              id: true,
              filename: true,
              mime: true,
              size: true,
              path: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: ((opts?.page ?? 1) - 1) * (opts?.limit ?? 10),
        take: opts?.limit ?? 10,
      }),
      this.prisma.mod.count({ where }),
    ]);
    const itemsWithUrls = items.map((m) => ({
      ...m,
      images: m.images.map((i) => ({ ...i, url: `/uploads/${i.path}` })),
    }));
    return {
      items: itemsWithUrls,
      page: opts?.page ?? 1,
      limit: opts?.limit ?? 10,
      total,
    };
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
        images: {
          select: {
            id: true,
            filename: true,
            mime: true,
            size: true,
            path: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!mod) throw new NotFoundException();
    const isAdmin = user?.role === 'ADMIN';
    if (!isAdmin && mod.status !== 'APPROVED') throw new NotFoundException();
    return {
      ...mod,
      images: mod.images.map((i) => ({ ...i, url: `/uploads/${i.path}` })),
    };
  }

  async update(
    slug: string,
    user: AuthUser,
    dto: {
      name?: string;
      description?: string;
      categories?: string[];
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    },
  ) {
    const mod = await this.prisma.mod.findUnique({ where: { slug } });
    if (!mod) throw new NotFoundException();
    const isAdmin = user.role === 'ADMIN';
    const isAuthor = mod.authorId === user.id;
    if (!isAdmin && !isAuthor) throw new ForbiddenException();

    // Only admin can change status
    const status = isAdmin ? dto.status : undefined;

    const categories = dto.categories?.length
      ? await this.prisma.category.findMany({
          where: { slug: { in: dto.categories.map((s) => s.toLowerCase()) } },
        })
      : undefined;

    const updated = await this.prisma.mod.update({
      where: { slug },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(status ? { status } : {}),
        ...(categories
          ? {
              categories: {
                set: [],
                connect: categories.map((c) => ({ id: c.id })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        authorId: true,
        categories: { select: { id: true, name: true, slug: true } },
        images: {
          select: {
            id: true,
            filename: true,
            mime: true,
            size: true,
            path: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      ...updated,
      images: updated.images.map((i) => ({ ...i, url: `/uploads/${i.path}` })),
    };
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

  async addImage(
    slug: string,
    user: AuthUser,
    file: { filename: string; mimetype: string; size: number; path: string },
  ) {
    const mod = await this.prisma.mod.findUnique({ where: { slug } });
    if (!mod) throw new NotFoundException();
    const isAdmin = user.role === 'ADMIN';
    const isAuthor = mod.authorId === user.id;
    if (!isAdmin && !isAuthor) throw new ForbiddenException();
    const count = await this.prisma.modImage.count({
      where: { modId: mod.id },
    });
    if (count >= 10) throw new ForbiddenException('Image limit reached');
    const normalized = file.path.replace(/\\/g, '/');
    const marker = '/uploads/';
    const idx = normalized.indexOf(marker);
    const relPath =
      idx >= 0
        ? normalized.slice(idx + marker.length)
        : path.basename(normalized);
    const img = await this.prisma.modImage.create({
      data: {
        modId: mod.id,
        filename: file.filename,
        mime: file.mimetype,
        size: file.size,
        path: relPath,
      },
      select: { id: true, filename: true, mime: true, size: true, path: true },
    });
    return { ...img, url: `/uploads/${img.path}` };
  }

  async removeImage(slug: string, id: string, user: AuthUser) {
    const mod = await this.prisma.mod.findUnique({ where: { slug } });
    if (!mod) throw new NotFoundException();
    const isAdmin = user.role === 'ADMIN';
    const isAuthor = mod.authorId === user.id;
    if (!isAdmin && !isAuthor) throw new ForbiddenException();
    const img = await this.prisma.modImage.findUnique({ where: { id } });
    if (!img || img.modId !== mod.id) throw new NotFoundException();
    await this.prisma.modImage.delete({ where: { id } });
    const abs = path.join(process.cwd(), 'uploads', img.path);
    try {
      fs.unlinkSync(abs);
    } catch (e) {
      void e;
    }
    return { deleted: true };
  }
}
