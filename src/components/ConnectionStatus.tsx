
import React from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WifiOff, Wifi } from 'lucide-react';

const ConnectionStatus = () => {
  const { isConnected } = useWebSocket();

  return (
    <Badge 
      id="connection-status-badge"
      className={cn(
        "inline-flex w-auto rounded-full px-1.5 py-0.5 text-xs font-medium ml-2",
        isConnected 
          ? "bg-green-100 text-green-700 border-green-200" 
          : "bg-red-100 text-red-700 border-red-200"
      )}
      variant="outline"
    >
      {isConnected ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
    </Badge>
  );
};

export default ConnectionStatus;
