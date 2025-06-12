// Global service worker registration script
(function() {
    // Only run on HTTPS or localhost
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.log('Service Worker requires HTTPS');
        return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
    }

    // Register service worker
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registered globally with scope:', registration.scope);
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('Service Worker update found');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            console.log('Service Worker updated and activated');
                        }
                    });
                });
            })
            .catch(function(error) {
                console.error('Service Worker registration failed:', error);
            });
    });
})();