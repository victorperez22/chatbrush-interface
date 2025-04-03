
import React, { useEffect, useState, useRef } from 'react';
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';
import Whiteboard from '@/components/Whiteboard';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { toast } from "sonner";
import { RetellWebClient } from "retell-client-js-sdk";

const IndexContent = () => {
  const isMobile = useIsMobile();
  const { connect, isConnected, sendMessage, messages } = useWebSocket();
  // Define the ref at the top level of the component, not inside useEffect
  const hasTriedConnecting = React.useRef(false);

  // Estados para gestionar la llamada
  const [callState, setCallState] = useState('idle'); // Posibles valores: 'idle', 'initiating', 'active', 'error'
  const [activeCallId, setActiveCallId] = useState<string | null>(null); // Para guardar el ID de la llamada activa
  
  // Referencia para el SDK de Retell y estado para saber si está listo
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const [isRetellReady, setIsRetellReady] = useState(false);

  // NUEVO useEffect para observar cambios en callState
  useEffect(() => {
    console.log(`[useEffect callState] El estado 'callState' AHORA es: ${callState}`);
    
    // Opcional: Añadir un toast aquí también podría ser útil
    if (callState === 'active') {
      toast.info(`Debug: callState ahora es '${callState}'`);
    }

  }, [callState]); // <-- Dependencia ÚNICA: callState
  
  // useEffect para inicializar el SDK de Retell
  useEffect(() => {
    console.log("Inicializando RetellWebClient SDK...");
    retellClientRef.current = new RetellWebClient();

    // Escuchar eventos globales del SDK (opcional pero útil para depurar)
    retellClientRef.current.on('audio_started', () => console.log('Retell SDK: Flujo de audio iniciado.'));
    retellClientRef.current.on('audio_stopped', () => console.log('Retell SDK: Flujo de audio detenido.'));
    retellClientRef.current.on('error', (error: string) => {
      console.error('Retell SDK: Error global ->', error);
      setCallState('error');
      toast.error(`Error del SDK de Retell: ${error}`);
      setActiveCallId(null); // Limpiar ID si hay error del SDK
    });

    setIsRetellReady(true); // Marcar como listo
    console.log("RetellWebClient SDK inicializado y listo.");

    // Función de limpieza al desmontar
    return () => {
      console.log("Desmontando componente, deteniendo llamada si está activa...");
      retellClientRef.current?.stopCall();
      retellClientRef.current = null; // Limpiar referencia
    }
  }, []); // Array vacío para ejecutar solo al montar

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
    } else if (callState === 'active') {
      console.log("Deteniendo llamada vía Retell SDK...");
      retellClientRef.current?.stopCall();
      
      // CAMBIO: Forzar estado a idle INMEDIATAMENTE después de pedir detener
      console.log("Cambiando estado manualmente a 'idle' al solicitar fin.");
      setCallState('idle');
      setActiveCallId(null); // Limpiar ID también
      
      // Opcional: notificar al backend también
      if (activeCallId) {
        console.log(`Enviando request_end_call para ID: ${activeCallId}`);
        const endMsg = {
          type: 'request_end_call',
          payload: { call_id: activeCallId }
        };
        sendMessage(endMsg);
      }
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

  // Process incoming WebSocket messages related to calls
  useEffect(() => {
    console.log('[useEffect messages] Se ejecutó. Longitud de messages:', messages.length);

    if (messages.length === 0) {
      console.log('[useEffect messages] No hay mensajes para procesar.');
      return; // Salir si no hay mensajes
    }

    // Obtener el ÚLTIMO mensaje recibido
    const latestMessage = messages[messages.length - 1];
    console.log('[useEffect messages] Último mensaje:', latestMessage);

    // Procesar el último mensaje según su tipo
    if (latestMessage && latestMessage.type === 'web_call_details') {
      console.log("[WS Mensaje] Recibidos detalles para llamada WebRTC:", latestMessage.payload);
      const accessToken = latestMessage.payload.access_token;
      
      if (retellClientRef.current && isRetellReady && accessToken && callState !== 'active') {
        console.log(`Iniciando llamada Retell SDK con Access Token...`);
        
        try {
          // Log the handlers before calling startCall to debug
          console.log("Llamando a startCall con accessToken");
          
          // FIXED: According to Retell SDK documentation, this is the correct way
          // to call startCall with the accessToken. The callbacks should be registered
          // using the .on() method, not passed to startCall directly
          retellClientRef.current.on('call_started', () => {
            console.log(">>> EVENTO call_started <<< ¡Conexión de audio establecida!");
            setCallState('active');
            console.log(">>> EVENTO call_started <<< Estado cambiado a 'active'.");
            // Comentado temporalmente para descartar interferencias
            // toast.success("Conectado con el Tutor IA");
          });
          
          retellClientRef.current.on('call_stopped', () => {
            console.log("Retell SDK: Llamada cerrada.");
            setCallState('idle');
            setActiveCallId(null);
          });
          
          // Start the call with just the accessToken
          retellClientRef.current.startCall({
            accessToken
          });

        } catch (error) {
          console.error("Error al llamar a retellClient.startCall:", error);
          setCallState('error');
          setActiveCallId(null);
          toast.error("No se pudo iniciar la llamada con el SDK.");
        }
      } else {
        if (!retellClientRef.current || !isRetellReady) console.error("SDK no listo.");
        if (!accessToken) console.error("Falta Access Token.");
        if (callState === 'active') console.warn("Intento de iniciar llamada cuando ya está activa.");
        setCallState('error');
        toast.error("Error interno al preparar la llamada.");
      }
    } else if (latestMessage && latestMessage.type === 'call_status') {
      // Manejo de call_status (importante para 'disconnected')
      console.log('[WS Mensaje] Recibido call_status:', latestMessage.payload);
      if (latestMessage.payload.status === 'disconnected') {
        console.log(`Llamada terminada (recibido via WS). Razón: ${latestMessage.payload.reason}`);
        setCallState('idle');
        setActiveCallId(null);
        toast.info(`Llamada terminada.`);
        // Asegurarse de que el SDK también se detenga
        retellClientRef.current?.stopCall();
      } else if (latestMessage.payload.status === 'connected') {
        // Confirmación secundaria
        console.log("Backend confirma estado conectado.");
        if (callState !== 'active') setCallState('active');
        if (latestMessage.payload.call_id) setActiveCallId(latestMessage.payload.call_id);
      }
    } else if (latestMessage && latestMessage.type === 'call_error') {
      // Manejo de call_error
      console.error('[WS Mensaje] Recibido call_error:', latestMessage.payload.message);
      setCallState('error');
      setActiveCallId(null);
      toast.error(`Error del servidor al iniciar llamada: ${latestMessage.payload.message}`);
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

      {/* Whiteboard container - now takes full width */}
      <div className="h-[calc(100vh-12rem)] w-full">
        <Whiteboard />
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
