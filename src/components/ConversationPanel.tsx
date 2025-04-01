
import React, { useEffect, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from '@/contexts/WebSocketContext';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

const ConversationPanel = () => {
  const { messages, isConnected } = useWebSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

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
