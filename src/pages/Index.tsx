
import React, { useEffect, useState } from 'react';
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';
import ConversationPanel from '@/components/ConversationPanel';
import Whiteboard from '@/components/Whiteboard';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { toast } from "sonner";

const IndexContent = () => {
  const isMobile = useIsMobile();
  const { connect, isConnected, sendMessage, messages } = useWebSocket();
  // Define the ref at the top level of the component, not inside useEffect
  const hasTriedConnecting = React.useRef(false);

  // Estados para gestionar la llamada
  const [callState, setCallState] = useState('idle'); // Posibles valores: 'idle', 'initiating', 'active', 'error'
  const [activeCallId, setActiveCallId] = useState<string | null>(null); // Para guardar el ID de la llamada activa

  // NUEVO useEffect para observar cambios en callState
  useEffect(() => {
    console.log(`[useEffect callState] El estado 'callState' AHORA es: ${callState}`);
    
    // Opcional: Añadir un toast aquí también podría ser útil
    if (callState === 'active') {
      toast.info(`Debug: callState ahora es '${callState}'`);
    }

  }, [callState]); // <-- Dependencia ÚNICA: callState

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
      toast.error('Error: No se pudo conectar con el servidor. Intenta recargar la página.');
      return;
    }

    if (callState === 'idle' || callState === 'error') {
      console.log("Intentando iniciar llamada...");
      setCallState('initiating');
      
      const startMsg = { 
        type: 'request_start_call',
        payload: {} 
      };
      
      console.log('>>> Enviando:', JSON.stringify(startMsg));
      sendMessage(startMsg);
    } else if (callState === 'active' && activeCallId) {
      console.log(`Intentando terminar llamada con ID: ${activeCallId}`);
      
      const endMsg = {
        type: 'request_end_call',
        payload: { call_id: activeCallId }
      };
      
      console.log('>>> Enviando:', JSON.stringify(endMsg));
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
  }, [isConnected, connect]); // Include isConnected to retry if connection status changes

  // Process incoming WebSocket messages related to calls (DEBUG SIMPLIFICADO)
  useEffect(() => {
    console.log('[useEffect messages] Se ejecutó. Longitud de messages:', messages.length); // Log 1: ¿Se ejecuta el efecto?

    if (messages.length === 0) {
      console.log('[useEffect messages] No hay mensajes para procesar.');
      return; // Salir si no hay mensajes
    }

    // Obtener el ÚLTIMO mensaje recibido, sea cual sea su tipo
    const latestMessage = messages[messages.length - 1];
    console.log('[useEffect messages] Último mensaje:', latestMessage); // Log 2: ¿Cuál es el último mensaje?

    // Comprobar si el último mensaje es el que nos interesa
    if (latestMessage && latestMessage.type === 'call_initiated') {
      console.log('[useEffect messages] ¡Último mensaje ES call_initiated!'); // Log 3: ¿Detectamos el tipo?

      // --- Aquí estaba la lógica del switch ---
      // Intentemos actualizar el estado directamente aquí para probar

      console.log('[useEffect messages - BEFORE SET STATE] Estado actual (callState):', callState); // Log 4: Estado ANTES

      setActiveCallId(latestMessage.payload.call_id);
      setCallState('active');

      console.log('[useEffect messages - AFTER SET STATE] Estado supuestamente actualizado a active.'); // Log 5: Log DESPUÉS

    } else if (latestMessage) {
      console.log(`[useEffect messages] Último mensaje NO es call_initiated (Tipo: ${latestMessage.type})`); // Log 6: Si no es el tipo esperado
    }

  }, [messages]); // Dependencia principal: messages

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
