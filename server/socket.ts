import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    // Client joins room for their user ID
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Client joins specific ticket thread room
    socket.on('join:ticket', (ticketId: string) => {
      if (ticketId) {
        socket.join(`ticket_${ticketId}`);
      }
    });

    socket.on('leave:ticket', (ticketId: string) => {
      if (ticketId) {
        socket.leave(`ticket_${ticketId}`);
      }
    });

    socket.on('disconnect', () => {
      // disconnected
    });
  });

  console.log('[Socket.io] Real-time engine initialized.');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Helpers to push real-time events to user or ticket room
export function emitTicketCreated(userId: string, ticket: any) {
  if (!io) return;
  io.to(`user_${userId}`).emit('ticket:created', ticket);
  io.emit('ticket:global_update', { action: 'created', ticket });
}

export function emitTicketStatusChanged(userId: string, ticketId: string, ticket: any) {
  if (!io) return;
  io.to(`user_${userId}`).emit('ticket:status_changed', ticket);
  io.to(`ticket_${ticketId}`).emit('ticket:status_changed', ticket);
  io.emit('ticket:global_update', { action: 'status_changed', ticket });
}

export function emitTicketMessageAdded(userId: string, ticketId: string, message: any, ticket: any) {
  if (!io) return;
  io.to(`ticket_${ticketId}`).emit('ticket:message', { message, ticket });
  io.to(`user_${userId}`).emit('ticket:update', ticket);
}

export function emitTicketEscalated(userId: string, ticketId: string, ticket: any) {
  if (!io) return;
  io.to(`user_${userId}`).emit('ticket:escalated', ticket);
  io.to(`ticket_${ticketId}`).emit('ticket:escalated', ticket);
  io.emit('ticket:global_update', { action: 'escalated', ticket });
}
