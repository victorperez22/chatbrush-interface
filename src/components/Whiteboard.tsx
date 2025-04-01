
import React from 'react';
import { useWebSocket, WebSocketMessage } from '@/contexts/WebSocketContext';
import { Pencil } from 'lucide-react';

const Whiteboard = () => {
  const { messages } = useWebSocket();

  // Function to generate HTML content for the whiteboard based on messages
  const renderWhiteboardContent = () => {
    const relevantMessages = messages.filter(msg => 
      ['update_pizarra_text', 'append_pizarra_text', 'clear_pizarra', 'show_image_pizarra']
      .includes(msg.type)
    );
    
    if (relevantMessages.length === 0) {
      return (
        <div className="text-center text-gray-400 mt-10">
          <p>El contenido de apoyo aparecerá aquí...</p>
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
      <div className="whiteboard-content space-y-4">
        {currentContent && (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: currentContent }}
          />
        )}
        {hasImage && (
          <div className="mt-4">
            <img 
              src={imageUrl} 
              alt="Whiteboard content" 
              className="max-w-full rounded-lg"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-primary/5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Pencil className="h-5 w-5 text-primary" />
          Pizarra Interactiva
        </h2>
      </div>
      
      <div 
        className="p-6 overflow-y-auto h-[calc(100%-4rem)]"
        id="interactive-pizarra"
      >
        {renderWhiteboardContent()}
      </div>
    </div>
  );
};

export default Whiteboard;
