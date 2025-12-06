import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
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
  }
}
