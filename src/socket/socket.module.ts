import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { RedisService } from 'src/redis/redis.service';

@Module({
  providers: [SocketGateway, RedisService],
})
export class SocketModule {}
