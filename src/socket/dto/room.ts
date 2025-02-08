import { IsArray, IsDate, IsNotEmpty, IsNumber } from 'class-validator';
import { SocketUserType } from 'src/user/entities/user.entity';

export class Room {
  @IsNotEmpty()
  roomId: string;

  @IsNotEmpty()
  roomName: string;

  @IsNotEmpty()
  roomAdmin: string;

  @IsNotEmpty()
  isPublic: boolean;

  @IsNumber()
  attendeesCount?: number;

  @IsArray()
  attendees?: Array<SocketUserType>;

  @IsDate()
  createdAt?: Date;
}
