import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8082/api/v1/ws/seats';

/**
 * Pure lightweight STOMP over WebSocket client hook for realtime seat status
 * @param {string|null} showtimeId
 * @param {function} onSeatEvent - callback receives { type: 'LOCK'|'RELEASE'|'BOOKED', seatIds, userId }
 */
export function useSeatSocket(showtimeId, onSeatEvent) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const callbackRef = useRef(onSeatEvent);

  // Keep latest callback reference
  useEffect(() => {
    callbackRef.current = onSeatEvent;
  }, [onSeatEvent]);

  useEffect(() => {
    if (!showtimeId) return;

    let socket = null;
    let isMounted = true;
    let pingInterval = null;

    try {
      socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        // Send STOMP CONNECT frame
        const connectFrame = "CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0";
        socket.send(connectFrame);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        const msg = event.data;

        // 1. Handshake response
        if (msg.startsWith('CONNECTED')) {
          setIsConnected(true);
          // Subscribe to showtime topic
          const subId = `sub-${showtimeId}-${Date.now()}`;
          const subFrame = `SUBSCRIBE\nid:${subId}\ndestination:/topic/showtimes.${showtimeId}.seats\n\n\0`;
          socket.send(subFrame);

          // Heartbeat ping every 10s
          pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send('\n');
            }
          }, 10000);
        }

        // 2. Broadcasted Event Message
        if (msg.startsWith('MESSAGE')) {
          try {
            // Find body after double newline and before null terminator
            const bodyIndex = msg.indexOf('\n\n');
            if (bodyIndex !== -1) {
              let bodyStr = msg.substring(bodyIndex + 2);
              if (bodyStr.endsWith('\0')) {
                bodyStr = bodyStr.slice(0, -1);
              }
              const data = JSON.parse(bodyStr.trim());
              if (callbackRef.current) {
                callbackRef.current(data);
              }
            }
          } catch (parseErr) {
            console.warn('[SeatSocket] Parse message error:', parseErr.message);
          }
        }
      };

      socket.onerror = (err) => {
        console.warn('[SeatSocket] WebSocket connection error (backend offline or connecting):', err);
        setIsConnected(false);
      };

      socket.onclose = () => {
        if (isMounted) setIsConnected(false);
        if (pingInterval) clearInterval(pingInterval);
      };
    } catch (e) {
      console.warn('[SeatSocket] Could not open WebSocket:', e.message);
    }

    return () => {
      isMounted = false;
      if (pingInterval) clearInterval(pingInterval);
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send('DISCONNECT\n\n\0');
          socket.close();
        } catch {
          // ignore
        }
      }
    };
  }, [showtimeId]);

  return { isConnected };
}
