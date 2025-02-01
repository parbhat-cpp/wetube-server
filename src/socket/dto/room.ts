import { IsNotEmpty } from 'class-validator';

export class Room {
  @IsNotEmpty()
  roomId: string;

  @IsNotEmpty()
  roomName: string;

  @IsNotEmpty()
  roomAdmin: string;

  @IsNotEmpty()
  isPublic: boolean;

  @IsNotEmpty()
  country: string;
}
