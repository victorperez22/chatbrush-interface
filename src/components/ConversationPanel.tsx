
import React, { useEffect, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from '@/contexts/WebSocketContext';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

const ConversationPanel = () => {
  const { messages } = useWebSocket();
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-primary/5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Conversación
        </h2>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        id="conversation-log"
      >
        {transcriptMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p>La conversación aparecerá aquí...</p>
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
        ? "bg-secondary self-end ml-auto rounded-br-none" 
        : "bg-primary text-white self-start rounded-bl-none"
    )}>
      <div className="font-medium mb-1">
        {isUser ? 'Usuario' : 'IA'}:
      </div>
      <div>{message.payload.content}</div>
    </div>
  );
};

export default ConversationPanel;
