import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('search')
  async search(@Query('q') q?: string) {
    const query = (q ?? '').trim();
    if (!query) return { items: [], q: '' };
    const items = await this.prisma.mod.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
    const thumbs = await Promise.all(
      items.map((m) =>
        this.prisma.modImage
          .findFirst({
            where: { modId: m.id },
            orderBy: { createdAt: 'asc' },
            select: { path: true },
          })
          .then((img) => (img ? `/uploads/${img.path}` : null)),
      ),
    );
    const mapped = items.map((m, idx) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      description: m.description,
      thumbnail: thumbs[idx],
    }));
    return { items: mapped, q: query };
  }
}
