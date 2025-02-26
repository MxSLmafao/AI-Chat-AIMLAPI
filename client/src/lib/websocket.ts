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
    if (socket?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ status: 'connected', socket: ws });
    };

    ws.onclose = () => {
      set({ status: 'disconnected', socket: null });
      // Attempt to reconnect after 2 seconds
      setTimeout(() => get().connect(), 2000);
    };

    ws.onerror = () => {
      set({ status: 'disconnected', socket: null });
    };

    ws.onmessage = (event) => {
      if (event.data === 'ping') {
        get().updateLastPing();
        ws.send('pong');
      }
    };

    set({ socket: ws, status: 'connecting' });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, status: 'disconnected' });
    }
  },
  setStatus: (status) => set({ status }),
  updateLastPing: () => set({ lastPing: Date.now() })
}));
