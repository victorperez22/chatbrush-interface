
import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Pencil } from 'lucide-react';

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
        <div className="text-center mt-10 p-10">
          <p className="text-xl font-semibold text-gray-800 font-poppins">{isConnected ? 'El contenido de apoyo aparecerá aquí...' : 'La pizarra se actualizará aquí...'}</p>
          <p className="mt-2 text-sm text-gray-600 font-poppins">Inicia una llamada con el tutor para comenzar</p>
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
      <div className="whiteboard-content">
        {currentContent && (
          <div 
            className="prose max-w-none prose-headings:text-blue-600 prose-a:text-blue-500 prose-blockquote:border-l-blue-500 prose-strong:text-blue-700"
            dangerouslySetInnerHTML={{ __html: currentContent }}
          />
        )}
        {hasImage && (
          <div className="mt-4">
            <img 
              src={imageUrl} 
              alt="Whiteboard content" 
              className="max-w-full rounded-lg border border-gray-200 shadow-sm"
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
    <div className="h-full bg-white rounded-lg shadow-md border border-gray-100">
      <div className="p-4 bg-blue-600 rounded-t-lg">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-white font-poppins">
          <Pencil className="h-5 w-5" />
          Pizarra Interactiva
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
