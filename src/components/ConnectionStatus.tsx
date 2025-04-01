
import React from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ConnectionStatus = () => {
  const { isConnected } = useWebSocket();

  return (
    <Badge 
      className={cn(
        "ml-2",
        isConnected ? "bg-green-500" : "bg-red-500"
      )}
    >
      {isConnected ? 'Conectado' : 'Desconectado'}
    </Badge>
  );
};

export default ConnectionStatus;
