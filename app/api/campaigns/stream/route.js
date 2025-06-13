export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Create a server-sent event stream for campaign updates
export async function GET() {
  const { campaignEvents } = await import('@/lib/campaignEvents')
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(encoder.encode(data))
      
      let isActive = true
      
      // Event handlers
      const handleStatsUpdate = ({ campaignId, stats }) => {
        if (!isActive) return
        try {
          const message = `data: ${JSON.stringify({ type: 'stats-updated', campaignId, stats })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE: Error sending stats update:', error)
          isActive = false
        }
      }
      
      const handleCampaignCreated = (campaign) => {
        if (!isActive) return
        try {
          const message = `data: ${JSON.stringify({ type: 'campaign-created', campaign })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE: Error sending campaign created event:', error)
          isActive = false
        }
      }
      
      const handleStatusChange = ({ campaignId, status }) => {
        if (!isActive) return
        try {
          const message = `data: ${JSON.stringify({ type: 'status-changed', campaignId, status })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE: Error sending status change event:', error)
          isActive = false
        }
      }
      
      const handleCampaignDeleted = (campaignId) => {
        if (!isActive) return
        try {
          const message = `data: ${JSON.stringify({ type: 'campaign-deleted', campaignId })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE: Error sending campaign deleted event:', error)
          isActive = false
        }
      }
      
      // Subscribe to events
      campaignEvents.on('stats-updated', handleStatsUpdate)
      campaignEvents.on('campaign-created', handleCampaignCreated)
      campaignEvents.on('status-changed', handleStatusChange)
      campaignEvents.on('campaign-deleted', handleCampaignDeleted)
      
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
          isActive = false
          clearInterval(heartbeat)
        }
      }, 30000) // Send heartbeat every 30 seconds
      
      // Clean up on close
      return () => {
        isActive = false
        clearInterval(heartbeat)
        campaignEvents.off('stats-updated', handleStatsUpdate)
        campaignEvents.off('campaign-created', handleCampaignCreated)
        campaignEvents.off('status-changed', handleStatusChange)
        campaignEvents.off('campaign-deleted', handleCampaignDeleted)
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