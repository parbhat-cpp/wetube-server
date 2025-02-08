import { SocketUserType } from 'src/user/entities/user.entity';

export class JoinRoomDto {
  user: SocketUserType;
  roomId: string;
}
