
import React, { useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowRightCircle, RefreshCw } from 'lucide-react';

const WebSocketConfig = () => {
  const { isConnected, setWebSocketUrl, connect, disconnect, reconnectAttempts } = useWebSocket();
  const [url, setUrl] = useState(() => localStorage.getItem('websocketUrl') || 'ws://localhost:8080');
  
  const handleConnect = () => {
    if (url.trim()) {
      setWebSocketUrl(url.trim());
      connect();
      toast.info('Intentando conectar al servidor WebSocket...');
    } else {
      toast.error('Por favor, introduce una URL válida');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Desconectado del servidor WebSocket');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 mb-4">
      <h3 className="text-sm font-semibold mb-3 text-slate-700">Configuración WebSocket</h3>
      
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ws://localhost:8080"
          className="text-sm"
        />
        {isConnected ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisconnect}
            className="whitespace-nowrap"
          >
            Desconectar
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleConnect}
            className="whitespace-nowrap"
          >
            <ArrowRightCircle className="h-4 w-4 mr-2" />
            Conectar
          </Button>
        )}
      </div>
      
      {!isConnected && reconnectAttempts > 0 && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-amber-600 flex items-center">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Intento de reconexión {reconnectAttempts}/5
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={connect} 
            className="text-xs h-7 px-2"
          >
            Reintentar ahora
          </Button>
        </div>
      )}
    </div>
  );
};

export default WebSocketConfig;
