
import React, { useEffect, useState } from 'react';
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';
import ConversationPanel from '@/components/ConversationPanel';
import Whiteboard from '@/components/Whiteboard';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';

const IndexContent = () => {
  const isMobile = useIsMobile();
  const { connect, isConnected, sendMessage } = useWebSocket();
  // Define the ref at the top level of the component, not inside useEffect
  const hasTriedConnecting = React.useRef(false);

  // Estados para gestionar la llamada
  const [callState, setCallState] = useState('idle'); // Posibles valores: 'idle', 'initiating', 'active', 'error'
  const [activeCallId, setActiveCallId] = useState<string | null>(null); // Para guardar el ID de la llamada activa

  // Calcular propiedades del botón basadas en callState
  let buttonText = 'Iniciar Llamada con Tutor';
  let buttonVariant: 'default' | 'destructive' | 'outline' = 'default';
  let isButtonDisabled = false;
  let ButtonIcon = Phone;

  if (callState === 'initiating') {
    buttonText = 'Iniciando...';
    isButtonDisabled = true;
  } else if (callState === 'active') {
    buttonText = 'Terminar Llamada';
    buttonVariant = 'destructive';
    ButtonIcon = PhoneOff;
  } else if (callState === 'error') {
    buttonText = 'Error - Reintentar';
    buttonVariant = 'outline';
  }

  // Manejador de clic para el botón de llamada
  const handleCallButtonClick = () => {
    if (!isConnected) {
      console.error('WebSocket no conectado. No se puede iniciar/terminar llamada.');
      setCallState('error');
      alert('Error: No se pudo conectar con el servidor. Intenta recargar la página.');
      return;
    }

    if (callState === 'idle' || callState === 'error') {
      console.log("Intentando iniciar llamada...");
      setCallState('initiating');
      
      const startMsg = { 
        type: 'request_start_call',
        payload: {} 
      };
      
      sendMessage(startMsg);
    } else if (callState === 'active' && activeCallId) {
      console.log(`Intentando terminar llamada con ID: ${activeCallId}`);
      
      const endMsg = {
        type: 'request_end_call',
        payload: { call_id: activeCallId }
      };
      
      sendMessage(endMsg);
    }
  };

  // Change the document title
  useEffect(() => {
    document.title = "AI Tutor Interface";
  }, []);

  // Connect to WebSocket automatically when the component mounts
  // The real connection happens in the WebSocketProvider and this is just a fallback
  useEffect(() => {
    if (!isConnected && !hasTriedConnecting.current) {
      console.log("IndexContent - Not connected, triggering manual connect");
      hasTriedConnecting.current = true;
      connect();
    }
    
    // No cleanup needed here
  }, [isConnected, connect]); // Include isConnected to retry if connection status changes

  // Efecto para escuchar eventos de llamada
  useEffect(() => {
    // Suscripción a eventos de llamada desde el WebSocketContext
    const handleWebSocketMessage = (message: any) => {
      if (!message) return;

      switch (message.type) {
        case 'call_initiated':
          console.log('Evento recibido: call_initiated, ID:', message.payload.call_id);
          setActiveCallId(message.payload.call_id);
          setCallState('active');
          break;
        case 'call_error':
          console.error('Evento recibido: call_error -', message.payload.message);
          setCallState('error');
          setActiveCallId(null);
          alert(`Error al iniciar la llamada: ${message.payload.message}`);
          break;
        case 'call_status':
          console.log('Evento recibido: call_status -', message.payload);
          if (message.payload.status === 'connected') {
            setCallState('active');
            if (message.payload.call_id) setActiveCallId(message.payload.call_id);
          } else if (message.payload.status === 'disconnected') {
            setCallState('idle');
            setActiveCallId(null);
            console.log(`Llamada terminada. Razón: ${message.payload.reason || 'No especificada'}`);
          }
          break;
        case 'processing_error':
          console.error('Evento recibido: processing_error -', message.payload.message);
          setCallState('error');
          alert(`Error del servidor: ${message.payload.message}`);
          break;
        case 'webhook_processing_error':
          console.error('Evento recibido: webhook_processing_error -', message.payload.message);
          break;
      }
    };

    // Esta lógica es para fines de demostración - en un escenario real,
    // implementaríamos un sistema de eventos para manejar esto más elegantemente
    const originalOnMessage = window.globalWebSocket?.onmessage;
    if (window.globalWebSocket) {
      window.globalWebSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error processing WebSocket message in call handler:', error);
        }
        
        // Mantener el comportamiento original
        if (originalOnMessage) {
          originalOnMessage(event);
        }
      };
    }

    // Cleanup
    return () => {
      if (window.globalWebSocket) {
        window.globalWebSocket.onmessage = originalOnMessage;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center">
            AI Tutor Interface
            <ConnectionStatus />
          </h1>
          <Button 
            id="call-button"
            onClick={handleCallButtonClick}
            disabled={isButtonDisabled || !isConnected}
            variant={buttonVariant}
            className="ml-auto flex items-center gap-2"
          >
            <ButtonIcon className="h-4 w-4" />
            {buttonText}
          </Button>
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
