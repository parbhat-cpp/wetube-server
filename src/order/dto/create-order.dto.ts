import { IsUUID } from 'class-validator';
import { UUID } from 'node:crypto';

export class CreateOrderDto {
  @IsUUID()
  id: UUID;

  @IsUUID()
  user_id: UUID;
}
