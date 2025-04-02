
import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket, WebSocketMessage } from '@/contexts/WebSocketContext';
import { cn } from '@/lib/utils';
import { MessageSquare, Send } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

const ConversationPanel = () => {
  const { messages, isConnected, connect } = useWebSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState('');

  // Filter messages to only show transcript types
  const transcriptMessages = messages.filter(
    msg => msg.type === 'transcript_user' || msg.type === 'transcript_ai'
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptMessages]);

  // Handle sending messages
  const handleSendMessage = () => {
    if (userInput.trim() === '') return;

    // Get the WebSocket instance from our context
    if (!isConnected) {
      console.error('WebSocket no está conectado.');
      // Try to reconnect
      connect();
      return;
    }

    // Create the message to send
    const messageToSend = {
      type: "user_message",
      payload: {
        content: userInput.trim()
      }
    };

    // Use our WebSocket context to send the message
    try {
      // Create local message representation for immediate feedback
      const localMessage: WebSocketMessage = {
        type: 'transcript_user',
        payload: {
          content: userInput.trim()
        }
      };

      // This won't actually send through WebSocket directly, 
      // but it adds the message to our local state for UI feedback
      // The actual WebSocket.send() is handled in the WebSocketContext
      
      // Instead, we'd need to extend our WebSocketContext to handle sending messages
      // For now, we'll use the WebSocket.send method directly from the global instance
      if (window.globalWebSocket && window.globalWebSocket.readyState === WebSocket.OPEN) {
        window.globalWebSocket.send(JSON.stringify(messageToSend));
      } else {
        console.error('No se puede acceder al WebSocket global');
      }

      // Clear the input
      setUserInput('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-slate-200">
      <div className="p-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-700">
          <MessageSquare className="h-5 w-5" />
          Conversación
        </h2>
      </div>
      
      <div 
        ref={scrollRef}
        id="conversation-log"
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
      >
        {transcriptMessages.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <p>{isConnected ? 'La conversación aparecerá aquí...' : 'Esperando conexión con el servidor...'}</p>
          </div>
        ) : (
          transcriptMessages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))
        )}
      </div>

      {/* Input area for sending messages */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Escribe tu mensaje aquí..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isConnected}
            className="flex-grow"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!isConnected || userInput.trim() === ''}
            size="sm"
          >
            <Send className="mr-1 h-4 w-4" />
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }: { message: WebSocketMessage }) => {
  const isUser = message.type === 'transcript_user';
  
  return (
    <div className={cn(
      "max-w-[80%] p-3 rounded-lg",
      isUser 
        ? "bg-blue-50 text-slate-700 self-end ml-auto rounded-br-none border border-blue-100" 
        : "bg-indigo-600 text-white self-start rounded-bl-none shadow-sm"
    )}>
      <div className={cn(
        "font-medium mb-1",
        isUser ? "text-blue-700" : "text-white/90"
      )}>
        {isUser ? 'Usuario' : 'IA'}:
      </div>
      <div className="text-sm">{message.payload.content}</div>
    </div>
  );
};

export default ConversationPanel;
