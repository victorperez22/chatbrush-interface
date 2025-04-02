
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from "sonner";

interface WebSocketContextType {
  isConnected: boolean;
  messages: WebSocketMessage[];
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: Record<string, any>) => boolean;
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

// Use the correct WebSocket URL
const WEBSOCKET_URL = 'ws://localhost:8080';

// Create a singleton WebSocket instance
let globalWebSocket: WebSocket | null = null;

// Expose the WebSocket instance globally for direct access when needed
declare global {
  interface Window {
    globalWebSocket: WebSocket | null;
  }
}

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
  const [isFirstConnection, setIsFirstConnection] = useState(true);
  const maxReconnectAttempts = 5;

  const disconnect = () => {
    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
      console.log("Manually disconnecting WebSocket");
      globalWebSocket.close(1000, 'User initiated disconnect');
      globalWebSocket = null;
      window.globalWebSocket = null;
      setIsConnected(false);
    }
  };

  const connect = () => {
    console.log("Manual connection attempt triggered");
    // Reset connection attempts on manual connect
    setReconnectAttempts(0);
    setupWebSocketConnection();
  };

  // Fixed function to send messages through WebSocket
  const sendMessage = (message: Record<string, any>): boolean => {
    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        globalWebSocket.send(messageString);
        console.log('Message sent:', messageString);
        
        // Remove the immediate user message display logic
        // We'll wait for the server to send back the transcript_user_final message
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    } else {
      console.error('WebSocket not connected');
      return false;
    }
  };

  const setupWebSocketConnection = () => {
    // If we already have a global socket, don't create a new one
    if (globalWebSocket && (globalWebSocket.readyState === WebSocket.CONNECTING || globalWebSocket.readyState === WebSocket.OPEN)) {
      console.log("Using existing global WebSocket connection");
      setSocket(globalWebSocket);
      return globalWebSocket;
    }
    
    try {
      // Close any existing socket before creating a new one
      if (globalWebSocket) {
        console.log("Closing existing global socket before creating a new one");
        globalWebSocket.close();
        globalWebSocket = null;
        window.globalWebSocket = null;
      }
      
      console.log('Attempting WebSocket connection to:', WEBSOCKET_URL);
      const ws = new WebSocket(WEBSOCKET_URL);
      globalWebSocket = ws;
      window.globalWebSocket = ws; // Expose globally

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setReconnectAttempts(0);
        setIsFirstConnection(false);
      };

      ws.onmessage = (event) => {
        try {
          // Parse message data safely with error handling
          let data: WebSocketMessage;
          try {
            data = JSON.parse(event.data) as WebSocketMessage;
          } catch (error) {
            console.error("Error parsing WebSocket message:", error, "Original message:", event.data);
            return;
          }
          
          console.log('WebSocket message received:', data);
          
          // Add all valid messages to the state
          if (data && data.type && data.payload) {
            setMessages((prevMessages) => [...prevMessages, data]);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setIsConnected(false);
        
        // Clear the globalWebSocket reference
        if (globalWebSocket === ws) {
          globalWebSocket = null;
          window.globalWebSocket = null;
        }
        
        // Attempt to reconnect if not at max attempts and not a normal closure
        if (reconnectAttempts < maxReconnectAttempts && event.code !== 1000) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Attempting reconnect in ${timeout}ms (attempt ${reconnectAttempts + 1})`);
          
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            setupWebSocketConnection();
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(ws);
      return ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      return null;
    }
  };

  // Set up WebSocket connection once when component mounts
  useEffect(() => {
    console.log("WebSocketProvider mounted - setting up initial connection (ONCE ONLY)");
    const ws = setupWebSocketConnection();
    
    // Clean up function to close WebSocket when component unmounts
    return () => {
      console.log("WebSocketProvider unmounting - closing connection");
      // Only close the connection if it's the one we created
      if (ws && ws === globalWebSocket && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounted');
        globalWebSocket = null;
        window.globalWebSocket = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <WebSocketContext.Provider value={{ 
      isConnected, 
      messages, 
      reconnectAttempts,
      connect,
      disconnect,
      sendMessage
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
