import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { randomUUID, UUID } from 'node:crypto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async createOrder(userId: UUID) {
    const orderExists = await this.ordersRepository.exists({
      where: {
        user_id: userId,
      },
    });

    if (orderExists) {
      throw new ConflictException('Order already exists');
    }

    const orderId = randomUUID();

    return this.ordersRepository.create({
      id: orderId,
      user_id: userId,
    });
  }
}
