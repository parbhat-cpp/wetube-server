import { UUID } from 'node:crypto';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryColumn({
    type: 'uuid',
    primary: true,
  })
  id: UUID;

  @Column({
    type: 'uuid',
  })
  user_id: UUID;
}
