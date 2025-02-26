import { useEffect } from "react";
import { useConnection } from "@/lib/websocket";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const { status, connect } = useConnection();

  useEffect(() => {
    connect();
    return () => {
      useConnection.getState().disconnect();
    };
  }, [connect]);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm border px-3 py-2 shadow-lg">
      {status === 'connected' ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500">Connected</span>
        </>
      ) : status === 'connecting' ? (
        <>
          <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
          <span className="text-sm text-yellow-500">Connecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">Disconnected</span>
        </>
      )}
    </div>
  );
}
