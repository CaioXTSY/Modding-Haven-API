import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { AuthUser } from 'src/auth/decorators/get-user.decorator';
import { ModsService } from './mods.service';
import { CreateModDto } from './dto/create-mod.dto';
import { UpdateModDto } from './dto/update-mod.dto';

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
  list(@GetUser() user?: AuthUser) {
    return this.mods.list(user);
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', type: String })
  bySlug(@Param('slug') slug: string, @GetUser() user?: AuthUser) {
    return this.mods.bySlug(slug, user);
  }

  @Patch(':slug')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiParam({ name: 'slug', type: String })
  update(@Param('slug') slug: string, @GetUser() user: AuthUser, @Body() dto: UpdateModDto) {
    return this.mods.update(slug, user, dto);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiParam({ name: 'slug', type: String })
  remove(@Param('slug') slug: string, @GetUser() user: AuthUser) {
    return this.mods.remove(slug, user);
  }
}
