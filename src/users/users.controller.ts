import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { AuthUser } from 'src/auth/decorators/get-user.decorator';
import { UsersService } from './users.service';
import { ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  me(@GetUser() user: AuthUser) {
    return this.usersService.findMe(user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      properties: { username: { type: 'string' }, email: { type: 'string' } },
    },
  })
  updateMe(
    @GetUser() user: AuthUser,
    @Body() body: { username?: string; email?: string },
  ) {
    return this.usersService.updateMe(user.id, body);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
