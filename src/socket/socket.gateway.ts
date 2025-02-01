import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Room } from './dto/room';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('create-room')
  async createRoom(client: Socket, @MessageBody() createRoomData: Room) {
    return 'create room event';
  }

  @SubscribeMessage('join-room')
  async joinRoom(client: Socket, roomKey: string) {
    return 'join room event';
  }
}
