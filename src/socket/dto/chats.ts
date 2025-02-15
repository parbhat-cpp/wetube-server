import { SocketUserType } from 'src/user/entities/user.entity';

export class ChatsDto {
  roomId: string;
  user: SocketUserType;
  message: string;
}
