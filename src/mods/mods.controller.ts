import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { AuthUser } from 'src/auth/decorators/get-user.decorator';
import { ModsService } from './mods.service';
import { CreateModDto } from './dto/create-mod.dto';
import { UpdateModDto } from './dto/update-mod.dto';
import { ListModsQueryDto } from './dto/list-mods.query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import type { Request } from 'express';

type UploadedFileType = {
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  originalname?: string;
};

@ApiTags('mods')
@Controller('mods')
export class ModsController {
  constructor(private readonly mods: ModsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  create(@GetUser() user: AuthUser, @Body() dto: CreateModDto) {
    return this.mods.create(user, dto);
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  list(@GetUser() user?: AuthUser, @Query() query?: ListModsQueryDto) {
    const page = Math.max(1, parseInt(query?.page ?? '1', 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(query?.limit ?? '10', 10) || 10),
    );
    const status = query?.status;
    const category = query?.category?.toLowerCase();
    return this.mods.list(user, { page, limit, status, category });
  }

  @Get(':slug')
  @UseGuards(OptionalAuthGuard)
  @ApiParam({ name: 'slug', type: String })
  bySlug(@Param('slug') slug: string, @GetUser() user?: AuthUser) {
    return this.mods.bySlug(slug, user);
  }

  @Patch(':slug')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiParam({ name: 'slug', type: String })
  update(
    @Param('slug') slug: string,
    @GetUser() user: AuthUser,
    @Body() dto: UpdateModDto,
  ) {
    return this.mods.update(slug, user, dto);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiParam({ name: 'slug', type: String })
  remove(@Param('slug') slug: string, @GetUser() user: AuthUser) {
    return this.mods.remove(slug, user);
  }

  @Post(':slug/images')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiParam({ name: 'slug', type: String })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          req: Request,
          file: UploadedFileType,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const slug = (req.params as Record<string, string>).slug;
          const dest = path.join(
            process.cwd(),
            'uploads',
            'mods',
            slug,
            'images',
          );
          fs.mkdirSync(dest, { recursive: true });
          (cb as (error: Error | null, destination: string) => void)(
            null,
            dest,
          );
        },
        filename: (
          req: Request,
          file: UploadedFileType,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const ext = path.extname(file.originalname ?? '').toLowerCase();
          const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          (cb as (error: Error | null, filename: string) => void)(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (
        req: Request,
        file: UploadedFileType,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const ext = path.extname(file.originalname ?? '').toLowerCase();
        const ok = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        cb(null, ok);
      },
    }),
  )
  uploadImage(
    @Param('slug') slug: string,
    @GetUser() user: AuthUser,
    @UploadedFile() file: UploadedFileType,
  ) {
    return this.mods.addImage(slug, user, {
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });
  }

  @Delete(':slug/images/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiParam({ name: 'slug', type: String })
  @ApiParam({ name: 'id', type: String })
  removeImage(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @GetUser() user: AuthUser,
  ) {
    return this.mods.removeImage(slug, id, user);
  }
}
