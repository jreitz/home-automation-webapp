import { NextRequest } from 'next/server';

// WebSocket-like SSE endpoint for MQTT updates
// This allows the browser to receive real-time sensor data

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
      
      // For now, simulate sensor updates
      // In production, this would connect to MQTT and forward messages
      const interval = setInterval(() => {
        const mockData = {
          type: 'sensor',
          device: 'shellyht-7917A0',
          sensor: 'temperature',
          value: 52 + Math.random() * 5,
          unit: '°F',
          timestamp: new Date().toISOString(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockData)}\n\n`));
      }, 5000);
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
