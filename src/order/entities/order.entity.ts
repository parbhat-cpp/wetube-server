import { UUID } from 'node:crypto';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryColumn({
    type: 'text',
    primary: true,
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  user_id: UUID;

  @Column({
    type: 'text',
    unique: true,
  })
  razorpay_payment_id: string;

  @Column({
    type: 'text',
    unique: true,
  })
  razorpay_order_id: string;

  @Column({
    type: 'text',
    unique: true,
  })
  razorpay_signature: string;
}
