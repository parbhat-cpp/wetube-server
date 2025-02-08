import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import 'dotenv/config';

@Injectable()
export class RedisService {
  public redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    });
  }
}
