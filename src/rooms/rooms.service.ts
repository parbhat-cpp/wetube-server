import { Injectable } from '@nestjs/common';
import { RoomType } from 'src/common/constants';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class RoomsService {
  constructor(private readonly redisService: RedisService) {}

  async getPublicRooms(cursor: number, count: number) {
    const [nextCursor, results] = await this.redisService.redis.hscan(
      RoomType.PUBLIC,
      cursor,
      'COUNT',
      count,
    );

    const data: Array<string> = [];
    for (let i = 0; i < results.length; i += 2) {
      data.push(results[i + 1]);
    }

    return {
      nextCursor,
      data,
    };
  }
}
