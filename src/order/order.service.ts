import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectRazorpay } from 'nestjs-razorpay';
import Razorpay from 'razorpay';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { UUID } from 'node:crypto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRazorpay() private readonly razorpayClient: Razorpay,
  ) {}

  async generateOrder() {
    return await this.razorpayClient.orders.create({
      amount: 10000,
      currency: 'INR',
      receipt: 'receipt#1',
      partial_payment: false,
    });
  }

  async createOrder(
    userId: UUID,
    orderId: string,
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
  ) {
    const orderExists = await this.ordersRepository.exists({
      where: {
        user_id: userId,
      },
    });

    if (orderExists) {
      throw new ConflictException('Order already exists');
    }

    const orderCreateResponse = await this.ordersRepository.insert({
      id: orderId,
      user_id: userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    await this.usersRepository.update(
      {
        id: userId,
      },
      {
        premium_account: orderId,
      },
    );

    return orderCreateResponse;
  }
}
