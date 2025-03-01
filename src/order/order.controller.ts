import { Controller, Request, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)
  async createOrder(@Request() request: Request) {
    const user = request['user'];
    const userId = user['sub'];

    return this.orderService.createOrder(userId);
  }
}
