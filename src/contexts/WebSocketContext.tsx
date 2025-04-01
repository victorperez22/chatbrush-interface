
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from "sonner";

interface WebSocketContextType {
  isConnected: boolean;
  messages: WebSocketMessage[];
  reconnectAttempts: number;
  setWebSocketUrl: (url: string) => void;
  connect: () => void;
  disconnect: () => void;
}

export interface WebSocketMessage {
  type: string;
  payload: {
    content: string;
    element_id?: string;
    [key: string]: any;
  };
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Default to a placeholder URL that will be replaced
const DEFAULT_WS_URL = 'ws://localhost:8000/ws';

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [webSocketUrl, setWebSocketUrl] = useState<string>(
    localStorage.getItem('websocketUrl') || DEFAULT_WS_URL
  );
  const [isFirstConnection, setIsFirstConnection] = useState(true);
  const maxReconnectAttempts = 5;

  const disconnect = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'User initiated disconnect');
      setIsConnected(false);
    }
  };

  const connect = () => {
    // Reset connection attempts on manual connect
    setReconnectAttempts(0);
    connectWebSocket();
  };

  const connectWebSocket = () => {
    try {
      // Disconnect any existing connection first
      if (socket) {
        socket.close();
      }
      
      console.log('Attempting WebSocket connection to:', webSocketUrl);
      const ws = new WebSocket(webSocketUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Only show toast for non-first connections to avoid spam
        if (!isFirstConnection) {
          toast.success('Conexión establecida con el servidor');
        }
        setIsFirstConnection(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', data);
          
          // Add message to state
          setMessages((prevMessages) => [...prevMessages, data]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setIsConnected(false);
        
        // Only show toast for unexpected closures and not on first attempt
        if (event.code !== 1000 && !isFirstConnection) {
          toast.error('La conexión con el servidor se ha cerrado');
        }
        
        // Attempt to reconnect if not at max attempts and not a normal closure
        if (reconnectAttempts < maxReconnectAttempts && event.code !== 1000) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Attempting reconnect in ${timeout}ms (attempt ${reconnectAttempts + 1})`);
          
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Only show toast for errors not on first attempt
        if (!isFirstConnection) {
          toast.error('Error en la conexión WebSocket');
        }
      };

      setSocket(ws);

      return ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      
      if (!isFirstConnection) {
        toast.error('No se pudo establecer la conexión WebSocket');
      }
      return null;
    }
  };

  // Save WebSocket URL to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('websocketUrl', webSocketUrl);
  }, [webSocketUrl]);

  useEffect(() => {
    const ws = connectWebSocket();
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [webSocketUrl]); // Only reconnect when URL changes

  return (
    <WebSocketContext.Provider value={{ 
      isConnected, 
      messages, 
      reconnectAttempts,
      setWebSocketUrl,
      connect,
      disconnect
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
