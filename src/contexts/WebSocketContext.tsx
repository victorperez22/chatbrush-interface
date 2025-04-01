
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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = () => {
    try {
      // Replace with your actual WebSocket server URL 
      // For production, you might want to use environment variables
      const webSocketUrl = 'ws://localhost:8000/ws';
      
      console.log('Attempting WebSocket connection to:', webSocketUrl);
      const ws = new WebSocket(webSocketUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setReconnectAttempts(0);
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

      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setIsConnected(false);
        
        // Only show toast for unexpected closures
        if (event.code !== 1000) {
          toast.error('La conexión con el servidor se ha cerrado');
        }
        
        // Attempt to reconnect if not at max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
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
        setIsConnected(false);
        toast.error('Error en la conexión WebSocket');
      };

      setSocket(ws);

      return ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast.error('No se pudo establecer la conexión WebSocket');
      return null;
    }
  };

  useEffect(() => {
    const ws = connectWebSocket();
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, messages }}>
      {children}
    </WebSocketContext.Provider>
  );
};
