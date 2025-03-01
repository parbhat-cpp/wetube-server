import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @UseGuards(AuthGuard)
  getPublicRooms(
    @Query('cursor', ParseIntPipe) cursor: number,
    @Query('count', ParseIntPipe) count: number,
  ) {
    if (!cursor) {
      cursor = 0;
    }

    if (!count) {
      count = 5;
    }

    return this.roomsService.getPublicRooms(cursor, count);
  }
}
