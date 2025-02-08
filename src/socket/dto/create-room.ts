import { SocketUserType } from 'src/user/entities/user.entity';
import { Room } from './room';

export class CreateRoomDto extends Room {
  roomId: string;
  attendees?: SocketUserType[];
  attendeesCount?: number;
  createdAt?: Date;
  isPublic: boolean;
  roomAdmin: string;
  roomName: string;
  user: SocketUserType;
}
