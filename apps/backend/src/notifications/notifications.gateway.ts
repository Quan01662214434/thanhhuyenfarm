import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/** Realtime channel — authenticate & join `user:{id}` rooms in production. */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*' },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected ${client.id}`);
  }

  broadcast(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }

  toOrganization(orgId: string, event: string, payload: unknown) {
    this.server.to(`org:${orgId}`).emit(event, payload);
  }
}
