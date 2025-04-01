
import { useEffect } from 'react';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import ConversationPanel from '@/components/ConversationPanel';
import Whiteboard from '@/components/Whiteboard';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useIsMobile();

  // Change the document title
  useEffect(() => {
    document.title = "AI Tutor Interface";
  }, []);

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              AI Tutor Interface
              <ConnectionStatus />
            </h1>
          </div>
        </header>

        <div className={`grid ${isMobile ? 'grid-rows-2 gap-6' : 'grid-cols-2 gap-8'} h-[calc(100vh-8rem)]`}>
          <div className="h-full">
            <ConversationPanel />
          </div>
          <div className="h-full">
            <Whiteboard />
          </div>
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Index;
