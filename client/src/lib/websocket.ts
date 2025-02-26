import { create } from 'zustand';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface ConnectionState {
  status: ConnectionStatus;
  lastPing: number;
  socket: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
  setStatus: (status: ConnectionStatus) => void;
  updateLastPing: () => void;
}

export const useConnection = create<ConnectionState>((set, get) => ({
  status: 'disconnected',
  lastPing: Date.now(),
  socket: null,
  connect: () => {
    const { socket } = get();

    // Check if there's already a connection attempt
    if (socket) {
      if (socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      } else {
        // Clean up existing socket if it's not open
        socket.close();
      }
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      set({ status: 'connecting', socket: ws });

      ws.onopen = () => {
        console.log('WebSocket connected');
        set({ status: 'connected', socket: ws });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        set({ status: 'disconnected', socket: null });
        // Attempt to reconnect after a delay
        setTimeout(() => {
          const current = get();
          if (current.status === 'disconnected') {
            current.connect();
          }
        }, 2000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ status: 'disconnected', socket: null });
      };

      ws.onmessage = (event) => {
        if (event.data === 'ping') {
          get().updateLastPing();
          ws.send('pong');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      set({ status: 'disconnected', socket: null });
    }
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      try {
        console.log('Closing WebSocket connection');
        socket.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      } finally {
        set({ socket: null, status: 'disconnected' });
      }
    }
  },
  setStatus: (status) => set({ status }),
  updateLastPing: () => set({ lastPing: Date.now() })
}));