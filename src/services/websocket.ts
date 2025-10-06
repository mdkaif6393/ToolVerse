import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketMessage {
  type: 'dashboard_update' | 'project_update' | 'client_update' | 'productivity_update' | 'analytics_update';
  data: any;
  timestamp: string;
}

export const useWebSocket = (onMessage?: (message: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { session } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messageHandlers = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const connect = () => {
    if (!session?.access_token) return;

    try {
      const wsUrl = `ws://localhost:8080?token=${session.access_token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
          
          // Call specific handlers for this message type
          const handlers = messageHandlers.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message.data));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Only attempt to reconnect for unexpected closures and within retry limit
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`WebSocket reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connect();
          }, timeout);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('WebSocket max reconnection attempts reached. Operating in offline mode.');
          setError('WebSocket server unavailable - operating in offline mode');
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket connection failed - this is normal if WebSocket server is not running');
        setError(null); // Don't show error for WebSocket unavailability
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket not available - operating in offline mode');
      setError(null); // Don't show error for WebSocket unavailability
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const subscribe = (messageType: string, handler: (data: any) => void) => {
    if (!messageHandlers.current.has(messageType)) {
      messageHandlers.current.set(messageType, new Set());
    }
    messageHandlers.current.get(messageType)!.add(handler);
  };

  const unsubscribe = (messageType: string, handler: (data: any) => void) => {
    const handlers = messageHandlers.current.get(messageType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        messageHandlers.current.delete(messageType);
      }
    }
  };

  useEffect(() => {
    // Only attempt WebSocket connection if session exists
    if (session?.access_token) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [session?.access_token]);

  return {
    isConnected,
    error,
    sendMessage,
    subscribe,
    unsubscribe,
    reconnect: connect,
    disconnect
  };
};

// Hook for dashboard-specific WebSocket updates
export const useDashboardWebSocket = (onUpdate?: (data: any) => void) => {
  const handleMessage = (message: WebSocketMessage) => {
    if (message.type === 'dashboard_update') {
      onUpdate?.(message.data);
    }
  };

  return useWebSocket(handleMessage);
};
