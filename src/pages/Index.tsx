
import { useEffect } from 'react';
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';
import ConversationPanel from '@/components/ConversationPanel';
import Whiteboard from '@/components/Whiteboard';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useIsMobile } from '@/hooks/use-mobile';

const IndexContent = () => {
  const isMobile = useIsMobile();
  const { connect, isConnected } = useWebSocket();

  // Change the document title
  useEffect(() => {
    document.title = "AI Tutor Interface";
  }, []);

  // Connect to WebSocket automatically when the component mounts
  // The real connection happens in the WebSocketProvider and this is just a fallback
  useEffect(() => {
    console.log("IndexContent mounted - connection status:", isConnected);
    if (!isConnected) {
      console.log("Not connected on initial mount, triggering manual connect");
      connect();
    }
  }, []); // Only run on mount, don't include isConnected here

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center">
            AI Tutor Interface
            <ConnectionStatus />
          </h1>
        </div>
      </header>

      <div className={`grid ${isMobile ? 'grid-rows-2 gap-6' : 'grid-cols-2 gap-8'} h-[calc(100vh-12rem)]`}>
        <div className="h-full">
          <ConversationPanel />
        </div>
        <div className="h-full">
          <Whiteboard />
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <WebSocketProvider>
      <IndexContent />
    </WebSocketProvider>
  );
};

export default Index;
