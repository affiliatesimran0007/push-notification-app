// Script to debug QB campaign issues
async function debugQBCampaign() {
  try {
    // First, let's get all campaigns to find the QB one
    console.log('Fetching campaigns from API...')
    const campaignsResponse = await fetch('https://push-notification-app-steel.vercel.app/api/campaigns')
    const campaignsData = await campaignsResponse.json()
    
    console.log('Total campaigns:', campaignsData.campaigns?.length || 0)
    
    // Find QB campaigns
    const qbCampaigns = campaignsData.campaigns?.filter(c => 
      c.name?.includes('QB') || c.title?.includes('QuickBooks')
    ) || []
    
    console.log('\nFound QB campaigns:', qbCampaigns.length)
    
    for (const campaign of qbCampaigns) {
      console.log(`\n=== Campaign: ${campaign.name} (${campaign.id}) ===`)
      console.log(`Status: ${campaign.status}`)
      console.log(`Sent: ${campaign.sentCount}, Failed: ${campaign.failedCount}`)
      console.log(`Icon: ${campaign.icon}`)
      
      // Get debug info for this campaign
      const debugResponse = await fetch(`https://push-notification-app-steel.vercel.app/api/campaigns/debug?id=${campaign.id}`)
      const debugData = await debugResponse.json()
      
      if (debugData.issues?.length > 0) {
        console.log('\nIssues detected:')
        debugData.issues.forEach(issue => console.log(`  - ${issue}`))
      }
      
      if (debugData.failedDeliveries?.length > 0) {
        console.log('\nFailed deliveries:')
        debugData.failedDeliveries.forEach(delivery => {
          console.log(`  - Error: ${delivery.error}`)
          console.log(`    Client: ${delivery.client?.browser} on ${delivery.client?.os}`)
        })
      }
    }
    
    // Also check if there are any clients
    console.log('\n\nChecking client status...')
    const clientsResponse = await fetch('https://push-notification-app-steel.vercel.app/api/clients')
    const clientsData = await clientsResponse.json()
    
    console.log('Total clients:', clientsData.clients?.length || 0)
    const validClients = clientsData.clients?.filter(c => c.accessStatus === 'allowed') || []
    console.log('Valid clients (allowed):', validClients.length)
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugQBCampaign()