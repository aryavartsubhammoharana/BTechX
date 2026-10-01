// BTechX - Smart Auto-Update & Cache Syncer (v15.6)
(function() {
  // Ignore local file:/// testing
  if (window.location.protocol.startsWith('file')) return;

  const CURRENT_VERSION = 15.6;
  const CHECK_INTERVAL = 25000; // Check every 25 seconds for ultra-fast syncing

  function getVersionJsonPath() {
    // Resolve relative path to version.json whether in root or subfolder
    const isSub = window.location.pathname.includes('/1stYearSub/') || window.location.pathname.includes('/2ndYearSub/');
    return (isSub ? '../version.json' : 'version.json') + '?t=' + Date.now();
  }

  function checkForUpdates() {
    fetch(getVersionJsonPath(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Version fetch returned ' + res.status);
    })
    .then(data => {
      if (data && typeof data.version === 'number' && data.version > CURRENT_VERSION) {
        console.log(`🚀 New version detected: v${data.version} (current: v${CURRENT_VERSION}). Refreshing...`);
        // Force refresh bypassing browser disk cache
        const targetUrl = window.location.pathname + '?v=' + data.version;
        window.location.replace(targetUrl);
      }
    })
    .catch(err => {
      console.debug('Version check skipped:', err.message);
    });
  }

  // 1. Run immediately on page load
  if (document.readyState === 'complete') {
    checkForUpdates();
  } else {
    window.addEventListener('load', checkForUpdates);
  }

  // 2. Also check when user switches tabs back to BTechX
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });

  // 3. Periodic background check
  setInterval(checkForUpdates, CHECK_INTERVAL);
})();
