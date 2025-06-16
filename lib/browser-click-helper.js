/**
 * Browser Click Helper - Handles browser-specific click requirements for notifications
 * Firefox and Edge require user gestures, so we make the entire page clickable
 */

export class BrowserClickHelper {
  constructor() {
    this.browser = this.detectBrowser();
    this.overlayActive = false;
  }
  
  detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    const isChrome = ua.includes('chrome') && !ua.includes('edg');
    const isSafari = ua.includes('safari') && !ua.includes('chrome');
    const isFirefox = ua.includes('firefox');
    const isEdge = ua.includes('edg');
    
    console.log('BrowserClickHelper detection:', {
      ua,
      isFirefox,
      isEdge,
      isChrome,
      isSafari
    });
    
    return {
      isChrome,
      isSafari,
      isFirefox,
      isEdge,
      requiresClick: isFirefox || isEdge,
      name: isFirefox ? 'Firefox' : isEdge ? 'Edge' : isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Unknown'
    };
  }
  
  async enableClickAnywhere(callback, options = {}) {
    // If browser doesn't require click or overlay already active, skip
    if (!this.browser.requiresClick || this.overlayActive) {
      return callback();
    }
    
    this.overlayActive = true;
    
    // Create invisible click overlay
    const overlay = document.createElement('div');
    overlay.id = 'notification-click-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      cursor: pointer;
      background: transparent;
    `;
    
    // Create hint message
    const hint = document.createElement('div');
    hint.id = 'notification-click-hint';
    hint.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 1000000;
      pointer-events: none;
      animation: pulseHint 2s ease-in-out infinite;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    hint.innerHTML = options.hintText || 'Click anywhere to continue...';
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulseHint {
        0%, 100% { opacity: 0.9; transform: translateX(-50%) scale(1); }
        50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);
    
    // Add elements to page
    document.body.appendChild(overlay);
    document.body.appendChild(hint);
    
    // Handle click
    const handleClick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove overlay and hint immediately
      overlay.remove();
      hint.remove();
      style.remove();
      this.overlayActive = false;
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Execute callback with user gesture
      try {
        await callback();
      } catch (error) {
        console.error('Callback execution failed:', error);
      }
    };
    
    overlay.addEventListener('click', handleClick, { once: true });
    
    // Auto-remove after timeout
    const timeout = options.timeout || 15000;
    setTimeout(() => {
      if (document.getElementById('notification-click-overlay')) {
        overlay.remove();
        hint.remove();
        style.remove();
        this.overlayActive = false;
      }
    }, timeout);
  }
  
  // Check if notification permission is needed
  needsPermission() {
    return 'Notification' in window && Notification.permission === 'default';
  }
  
  // Get browser-specific instructions
  getInstructions() {
    const instructions = {
      Firefox: 'Firefox requires your interaction to show notifications.',
      Edge: 'Microsoft Edge requires your interaction to show notifications.',
      Chrome: 'Click Allow when prompted to receive notifications.',
      Safari: 'Click Allow when prompted to receive notifications.'
    };
    
    return instructions[this.browser.name] || instructions.Chrome;
  }
}

// For backward compatibility with existing code
export function detectBrowserRequiresClick() {
  const helper = new BrowserClickHelper();
  return helper.browser.requiresClick;
}

export default BrowserClickHelper;