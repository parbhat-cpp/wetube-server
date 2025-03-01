import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RedisService],
})
export class RoomsModule {}
