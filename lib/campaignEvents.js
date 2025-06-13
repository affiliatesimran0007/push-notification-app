import { EventEmitter } from 'events'

// Create a singleton event emitter for campaign events
class CampaignEvents extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100) // Allow multiple SSE connections
  }

  // Emit campaign stats update
  emitStatsUpdate(campaignId, stats) {
    this.emit('stats-updated', { campaignId, stats })
  }

  // Emit new campaign created
  emitCampaignCreated(campaign) {
    this.emit('campaign-created', campaign)
  }

  // Emit campaign status change
  emitStatusChange(campaignId, status) {
    this.emit('status-changed', { campaignId, status })
  }

  // Emit campaign deleted
  emitCampaignDeleted(campaignId) {
    this.emit('campaign-deleted', campaignId)
  }
}

// Export singleton instance
export const campaignEvents = new CampaignEvents()