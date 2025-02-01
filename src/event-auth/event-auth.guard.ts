import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class EventAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const wsContext = context.switchToWs();
    const wsClient = wsContext.getClient() as Socket;

    const token = wsClient.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new WsException({
        error: 'Unauthorized Error: No token provided',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });
      wsClient['user'] = payload;
    } catch (e) {
      throw new WsException({
        error: e.toString(),
      });
    }
    return true;
  }
}
