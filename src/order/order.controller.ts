import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('generate')
  @UseGuards(AuthGuard)
  async generateOrder() {
    return this.orderService.generateOrder();
  }

  @Post('create')
  @UseGuards(AuthGuard)
  async createOrder(
    @Request() request: Request,
    @Body(ValidationPipe) orderData: CreateOrderDto,
  ) {
    const user = request['user'];
    const userId = user['sub'];

    return this.orderService.createOrder(
      userId,
      orderData.id,
      orderData.razorpay_order_id,
      orderData.razorpay_payment_id,
      orderData.razorpay_signature,
    );
  }
}
