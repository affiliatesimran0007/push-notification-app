export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Create a server-sent event stream
export async function GET() {
  // Dynamic import to avoid webpack bundling issues
  const { clientEvents } = await import('@/lib/clientEvents')
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(encoder.encode(data))
      
      // Track if the connection is still active
      let isActive = true
      
      // Event handlers
      const handleNewClient = (client) => {
        if (!isActive) return
        try {
          console.log('SSE: New client event received:', client.id)
          const message = `data: ${JSON.stringify({ type: 'new-client', client })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE: Error sending new client event:', error)
          isActive = false
        }
      }
      
      const handleClientDeleted = (clientId) => {
        if (!isActive) return
        try {
          const message = `data: ${JSON.stringify({ type: 'client-deleted', clientId })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE: Error sending client deleted event:', error)
          isActive = false
        }
      }
      
      const handleClientUpdated = (client) => {
        if (!isActive) return
        try {
          const message = `data: ${JSON.stringify({ type: 'client-updated', client })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE: Error sending client updated event:', error)
          isActive = false
        }
      }
      
      // Subscribe to events
      clientEvents.on('new-client', handleNewClient)
      clientEvents.on('client-deleted', handleClientDeleted)
      clientEvents.on('client-updated', handleClientUpdated)
      
      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeat)
          return
        }
        try {
          const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`
          controller.enqueue(encoder.encode(heartbeatData))
        } catch (error) {
          // Client disconnected
          isActive = false
          clearInterval(heartbeat)
        }
      }, 30000) // Send heartbeat every 30 seconds
      
      // Clean up on close
      return () => {
        isActive = false
        clearInterval(heartbeat)
        clientEvents.off('new-client', handleNewClient)
        clientEvents.off('client-deleted', handleClientDeleted)
        clientEvents.off('client-updated', handleClientUpdated)
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}