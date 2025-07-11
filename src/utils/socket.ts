import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(token?: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket'], // Force websocket for reliability
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket.IO connect_error:', err);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Socket.IO disconnected:', reason);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinHotelRoom(hotelId: string) {
    if (this.socket) {
      this.socket.emit('joinHotel', hotelId);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketManager = new SocketManager(
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
);