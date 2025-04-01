
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from "sonner";

interface WebSocketContextType {
  isConnected: boolean;
  messages: WebSocketMessage[];
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

  useEffect(() => {
    // Replace with your actual WebSocket server URL
    const webSocketUrl = 'ws://localhost:8000/ws';
    
    try {
      const ws = new WebSocket(webSocketUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        toast.success('Conexión establecida con el servidor');
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

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        toast.error('La conexión con el servidor se ha cerrado');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        toast.error('Error en la conexión WebSocket');
      };

      setSocket(ws);

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast.error('No se pudo establecer la conexión WebSocket');
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, messages }}>
      {children}
    </WebSocketContext.Provider>
  );
};
