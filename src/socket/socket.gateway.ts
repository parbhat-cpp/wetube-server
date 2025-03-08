import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Room } from './dto/room';
import { RedisService } from 'src/redis/redis.service';
import { SocketEvents } from 'src/common/events';
import { SocketUserType } from '../user/entities/user.entity';
import { RoomType } from 'src/common/constants';
import { JwtService } from '@nestjs/jwt';
import { CreateRoomDto } from './dto/create-room';
import { JoinRoomDto } from './dto/join-room';
import { Logger } from '@nestjs/common';
import { RemoveAttendeeDto } from './dto/remove-attendee';
import { ChatsDto } from './dto/chats';
import { SetVideoDto } from './dto/set-video';
import { PauseVideoDto } from './dto/pause-video';
import { SeekVideoDto } from './dto/seek-video';

@WebSocketGateway({
  cors: {
    origin: '*/*',
    allowedHeaders: true,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection {
  constructor(
    private readonly redisService: RedisService,
    private jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {
    const token = socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new WsException('Authorization Error: No token provided');
    }

    try {
      await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });
      socket['user'] = {
        socketId: socket.id,
      };
    } catch (e) {
      Logger.log(e);

      socket.emit(SocketEvents.AUTH_FAILED);
    }
  }

  @SubscribeMessage(SocketEvents.CREATE_ROOM)
  async createRoom(client: Socket, createRoomData: CreateRoomDto) {
    const roomId = createRoomData.roomId;

    const user: SocketUserType = createRoomData.user;
    user.socketId = client.id;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      client.emit(SocketEvents.ROOM_EXISTS);
      return;
    }

    createRoomData.attendeesCount = 1;
    createRoomData.attendees = [user];
    createRoomData.createdAt = new Date();

    const roomData = {
      [roomId]: JSON.stringify(createRoomData),
    };

    if (createRoomData.isPublic) {
      await this.redisService.redis.hset(RoomType.PUBLIC, roomData);
    } else {
      await this.redisService.redis.hset(RoomType.PRIVATE, roomData);
    }
    client.emit(SocketEvents.ROOM_CREATED, roomData);
  }

  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  async joinRoom(client: Socket, joinRoomData: JoinRoomDto) {
    const user: SocketUserType = joinRoomData.user;
    user.socketId = client.id;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      joinRoomData.roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      joinRoomData.roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      }

      if (privateRoomExists) {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hget(
        roomType,
        joinRoomData.roomId,
      );

      const roomDataJson: Room = JSON.parse(roomData);

      if (
        !roomDataJson.attendees[0].premium_account &&
        roomDataJson.attendeesCount === 5
      ) {
        client.emit(SocketEvents.ROOM_LIMIT_REACHED);
        return;
      }

      roomDataJson.attendeesCount += 1;
      roomDataJson.attendees.push(user);

      const updateRoomData = {
        [joinRoomData.roomId]: JSON.stringify(roomDataJson),
      };

      await this.redisService.redis.hset(roomType, updateRoomData);

      client.emit(SocketEvents.ENTER_ROOM, updateRoomData);

      for (let i = 0; i < roomDataJson.attendees.length - 1; i++) {
        const roomMemberSocketId = roomDataJson.attendees[i].socketId;

        client.to(roomMemberSocketId).emit(SocketEvents.NEW_ATTENDEE, user);
      }
    } else {
      client.emit(SocketEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(SocketEvents.EXIT_ROOM)
  async leaveRoom(client: Socket, roomId: string) {
    const userId = client.id;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hget(roomType, roomId);

      const roomDataJson: Room = JSON.parse(roomData);

      const roomAdmin = roomDataJson['attendees'][0];

      // When room admin exit room
      if (roomAdmin.socketId === userId) {
        for (let i = 0; i < roomDataJson.attendees.length; i++) {
          const attendee = roomDataJson.attendees[i];

          client.to(attendee.socketId).emit(SocketEvents.LEAVE_ROOM);

          await this.redisService.redis.hdel(roomType, roomId);
        }
      } else {
        // Get user info
        const user = roomDataJson.attendees.filter(
          (attendee) => attendee.socketId === userId,
        );

        // Remove user from room and update
        roomDataJson.attendees = roomDataJson.attendees.filter(
          (attendee) => attendee.socketId !== userId,
        );

        roomDataJson.attendeesCount -= 1;

        const updateRoomData = {
          [roomId]: JSON.stringify(roomDataJson),
        };

        await this.redisService.redis.hset(roomType, updateRoomData);

        client.emit(
          SocketEvents.ATTENDEE_LEFT,
          user[0].username ?? user[0].full_name,
        );

        for (let i = 0; i < roomDataJson.attendees.length; i++) {
          client
            .to(roomDataJson.attendees[i].socketId)
            .emit(
              SocketEvents.ATTENDEE_LEFT,
              user[0].username ?? user[0].full_name,
            );
        }
      }
    } else {
      client.emit(SocketEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(SocketEvents.REMOVE_ATTENDEE)
  async removeAttendee(client: Socket, removeAttendeeData: RemoveAttendeeDto) {
    const roomId = removeAttendeeData.roomId;
    const userId = removeAttendeeData.userId;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hget(roomType, roomId);

      const roomDataJson: Room = JSON.parse(roomData);

      const roomAdmin = roomDataJson['attendees'][0];

      if (roomAdmin.socketId !== client.id) {
        return;
      }

      client.to(userId).emit(SocketEvents.LEAVE_ROOM);

      const user = roomDataJson.attendees.filter(
        (attendee) => attendee.socketId === userId,
      );

      roomDataJson.attendees = roomDataJson.attendees.filter(
        (attendee) => attendee.socketId !== userId,
      );

      roomDataJson.attendeesCount -= 1;

      const updateRoomData = {
        [roomId]: JSON.stringify(roomDataJson),
      };

      await this.redisService.redis.hset(roomType, updateRoomData);

      client.emit(SocketEvents.ATTENDEE_KICKED, user[0]);

      for (let i = 0; i < roomDataJson.attendees.length; i++) {
        client
          .to(roomDataJson.attendees[i].socketId)
          .emit(SocketEvents.ATTENDEE_KICKED, user[0]);
      }
    } else {
      client.emit(SocketEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(SocketEvents.SEND_MESSAGE)
  async sendMessage(client: Socket, chat: ChatsDto) {
    const userId = client.id;
    const roomId = chat.roomId;
    chat.user.socketId = userId;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }

      const roomData = await this.redisService.redis.hget(roomType, roomId);

      const roomDataJson: Room = JSON.parse(roomData);

      for (let i = 0; i < roomDataJson.attendees.length; i++) {
        const userSocketId = roomDataJson.attendees[i].socketId;

        client.to(userSocketId).emit(SocketEvents.RECEIVE_MESSAGE, {
          sendBy: chat.user,
          message: chat.message,
        });
      }
    } else {
      client.emit(SocketEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(SocketEvents.SET_VIDEO)
  async setVideo(client: Socket, setVideoData: SetVideoDto) {
    const roomId = setVideoData.roomId;
    const videoId = setVideoData.videoId;
    const username = setVideoData.username;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }
      const roomData = await this.redisService.redis.hget(roomType, roomId);

      const roomDataJson: Room = JSON.parse(roomData);

      for (let i = 0; i < roomDataJson.attendees.length; i++) {
        const userSocketId = roomDataJson.attendees[i].socketId;

        client.to(userSocketId).emit(SocketEvents.SET_VIDEO_ID, {
          username: username,
          videoId: videoId,
        });
      }
    } else {
      client.emit(SocketEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(SocketEvents.PAUSE_VIDEO)
  async pauseVideo(client: Socket, pauseVideoData: PauseVideoDto) {
    const roomId = pauseVideoData.roomId;
    const username = pauseVideoData.username;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }
      const roomData = await this.redisService.redis.hget(roomType, roomId);

      const roomDataJson: Room = JSON.parse(roomData);

      for (let i = 0; i < roomDataJson.attendees.length; i++) {
        const userSocketId = roomDataJson.attendees[i].socketId;

        client.to(userSocketId).emit(SocketEvents.SET_VIDEO_PAUSE, {
          username: username,
        });
      }
    } else {
      client.emit(SocketEvents.ROOM_NOT_FOUND);
    }
  }

  @SubscribeMessage(SocketEvents.SEEK_VIDEO)
  async seekVideo(client: Socket, seekVideoData: SeekVideoDto) {
    const position = seekVideoData.position;
    const roomId = seekVideoData.roomId;
    const username = seekVideoData.username;

    const publicRoomExists = await this.redisService.redis.hexists(
      RoomType.PUBLIC,
      roomId,
    );

    const privateRoomExists = await this.redisService.redis.hexists(
      RoomType.PRIVATE,
      roomId,
    );

    if (publicRoomExists || privateRoomExists) {
      let roomType = '';

      if (publicRoomExists) {
        roomType = RoomType.PUBLIC;
      } else {
        roomType = RoomType.PRIVATE;
      }
      const roomData = await this.redisService.redis.hget(roomType, roomId);

      const roomDataJson: Room = JSON.parse(roomData);

      for (let i = 0; i < roomDataJson.attendees.length; i++) {
        const userSocketId = roomDataJson.attendees[i].socketId;

        client.to(userSocketId).emit(SocketEvents.SEEK_VIDEO_TO, {
          username: username,
          position: position,
        });
      }
    } else {
      client.emit(SocketEvents.ROOM_NOT_FOUND);
    }
  }
}
