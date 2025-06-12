import { EventEmitter } from 'events'

// Create a singleton event emitter for client events
class ClientEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100) // Allow many SSE connections
  }
  
  notifyNewClient(client) {
    console.log('ClientEvents: Emitting new-client event')
    this.emit('new-client', client)
  }
  
  notifyClientDeleted(clientId) {
    console.log('ClientEvents: Emitting client-deleted event')
    this.emit('client-deleted', clientId)
  }
  
  notifyClientUpdated(client) {
    console.log('ClientEvents: Emitting client-updated event')
    this.emit('client-updated', client)
  }
}

// Create global singleton that persists across requests
let globalClientEvents

if (process.env.NODE_ENV === 'production') {
  globalClientEvents = new ClientEventEmitter()
} else {
  // In development, use a global variable to maintain the instance across hot reloads
  if (!global.clientEvents) {
    global.clientEvents = new ClientEventEmitter()
  }
  globalClientEvents = global.clientEvents
}

// Export singleton instance
export const clientEvents = globalClientEvents