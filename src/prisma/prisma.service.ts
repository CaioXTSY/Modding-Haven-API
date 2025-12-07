import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  get user() {
    return super.user;
  }
  get refreshToken() {
    return super.refreshToken;
  }
  get category() {
    return super.category;
  }
  get mod() {
    return super.mod;
  }
  get modImage() {
    return super.modImage;
  }
  get modVersion() {
    return super.modVersion;
  }
  get modVersionFile() {
    return super.modVersionFile;
  }
  constructor(config: ConfigService) {
    const url = config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL is not defined');
    }
    const parsed = new URL(url);
    const adapter = new PrismaMariaDb({
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      connectionLimit: 5,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    const firstUser = await this.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (firstUser) {
      const admin = await this.user.findFirst({ where: { role: 'ADMIN' } });
      if (!admin) {
        await this.user.update({
          where: { id: firstUser.id },
          data: { role: 'ADMIN' },
        });
      }
    }
  }
}
