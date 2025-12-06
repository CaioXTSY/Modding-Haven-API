import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { UsersService } from 'src/users/users.service';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('users/:id')
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('users/:id')
  @ApiParam({ name: 'id', type: String })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete('users/:id')
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
