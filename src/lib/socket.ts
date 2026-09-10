import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected to backend server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected from backend server');
    });
  }
  return socket;
}

export function joinUserRoom(userId: string) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join:user', userId);
  } else if (s) {
    s.once('connect', () => {
      s.emit('join:user', userId);
    });
  }
}

export function joinTicketRoom(ticketId: string) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join:ticket', ticketId);
  } else if (s) {
    s.once('connect', () => {
      s.emit('join:ticket', ticketId);
    });
  }
}

export function leaveTicketRoom(ticketId: string) {
  const s = getSocket();
  if (s) {
    s.emit('leave:ticket', ticketId);
  }
}
