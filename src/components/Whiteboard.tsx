
import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Pencil, Sparkles } from 'lucide-react';

const Whiteboard = () => {
  const { messages, isConnected } = useWebSocket();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Function to generate HTML content for the whiteboard based on messages
  const renderWhiteboardContent = () => {
    const relevantMessages = messages.filter(msg => 
      ['update_pizarra_text', 'append_pizarra_text', 'clear_pizarra', 'show_image_pizarra']
      .includes(msg.type)
    );
    
    if (relevantMessages.length === 0) {
      return (
        <div className="text-center mt-10 p-10 animate-pulse">
          <Sparkles className="mx-auto h-12 w-12 mb-4 text-yellow-300" />
          <p className="text-xl font-semibold text-gray-800">{isConnected ? 'El contenido de apoyo aparecerá aquí...' : 'La pizarra se actualizará aquí...'}</p>
          <p className="mt-2 text-sm text-gray-600">Inicia una llamada con el tutor para comenzar</p>
        </div>
      );
    }

    // Process messages in chronological order to determine current state
    let currentContent = '';
    let hasImage = false;
    let imageUrl = '';

    for (const message of relevantMessages) {
      switch (message.type) {
        case 'clear_pizarra':
          currentContent = '';
          hasImage = false;
          break;
        case 'update_pizarra_text':
          currentContent = message.payload.content;
          break;
        case 'append_pizarra_text':
          currentContent += message.payload.content;
          break;
        case 'show_image_pizarra':
          hasImage = true;
          imageUrl = message.payload.content;
          break;
      }
    }

    return (
      <div className="whiteboard-content space-y-4 transition-all duration-500 ease-in-out hover:shadow-lg">
        {currentContent && (
          <div 
            className="prose max-w-none prose-headings:text-blue-600 prose-a:text-blue-500 hover:prose-a:text-blue-700 prose-blockquote:border-l-blue-500 prose-strong:text-blue-700"
            dangerouslySetInnerHTML={{ __html: currentContent }}
          />
        )}
        {hasImage && (
          <div className="mt-4 transform hover:scale-[1.02] transition-transform duration-300">
            <img 
              src={imageUrl} 
              alt="Whiteboard content" 
              className="max-w-full rounded-lg border border-gray-200 shadow-xl"
            />
          </div>
        )}
      </div>
    );
  };
  
  // Auto-scroll to bottom whenever content changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full bg-white rounded-lg shadow-xl border border-gray-100">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
          <Pencil className="h-5 w-5 text-yellow-300" />
          <span className="bg-gradient-to-r from-yellow-200 to-yellow-50 text-transparent bg-clip-text">
            Pizarra Interactiva
          </span>
        </h2>
      </div>
      
      <div 
        ref={contentRef}
        className="p-6 overflow-y-auto h-[calc(100%-4rem)] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
        id="interactive-pizarra"
      >
        {renderWhiteboardContent()}
      </div>
    </div>
  );
};

export default Whiteboard;
