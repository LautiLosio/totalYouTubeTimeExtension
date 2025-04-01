// Initialize video element when a YouTube video page loads
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only handle main frame navigation to avoid handling iframes
  if (details.frameId !== 0) return;
  
  try {
    // Inject the initialization script
    await chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      func: () => {
        // Function to initialize video element
        function initializeVideo() {
          const video = document.querySelector('video');
          if (video) {
            // Force metadata loading
            video.preload = 'metadata';
            // Try to load metadata without playing
            video.load();
            return true;
          }
          return false;
        }

        // Try immediately
        if (!initializeVideo()) {
          // If video element is not ready, set up a mutation observer to watch for it
          const observer = new MutationObserver((mutations, obs) => {
            if (initializeVideo()) {
              obs.disconnect(); // Stop observing once we've initialized
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      }
    });
  } catch (error) {
    console.error('Error injecting initialization script:', error);
  }
}, {
  url: [{
    hostEquals: 'www.youtube.com',
    pathContains: '/watch'
  }]
}); 