import { UUID } from 'node:crypto';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'profiles' })
export class User {
  @PrimaryColumn({
    type: 'uuid',
    primary: true,
  })
  id: UUID;

  @Column({
    type: 'text',
  })
  full_name: string;

  @Column({
    unique: true,
    type: 'text',
    nullable: true,
  })
  username: string;

  @Column({
    type: 'text',
  })
  avatar_url: string;
}
