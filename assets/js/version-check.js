// BTechX - Smart Auto-Update & Cache Syncer (v15.6)
(function() {
  // Ignore local file:/// testing or document viewer
  if (window.location.protocol.startsWith('file')) return;
  if (window.location.pathname.includes('viewer.html')) return;

  // Strict session lock: NEVER reload more than ONCE per browser session
  if (sessionStorage.getItem('btechx_refresh_attempted')) return;

  const CURRENT_VERSION = 15.6;

  function getVersionJsonPath() {
    const isSub = window.location.pathname.includes('/1stYearSub/') || window.location.pathname.includes('/2ndYearSub/');
    return (isSub ? '../version.json' : 'version.json') + '?t=' + Date.now();
  }

  function checkForUpdates() {
    if (sessionStorage.getItem('btechx_refresh_attempted')) return;

    fetch(getVersionJsonPath(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Status: ' + res.status);
    })
    .then(data => {
      if (data && typeof data.version === 'number' && data.version > CURRENT_VERSION) {
        // Lock immediately to prevent ANY possible reload loops
        sessionStorage.setItem('btechx_refresh_attempted', 'true');
        console.log(`🚀 New version v${data.version} detected. Syncing once...`);
        // Clean reload preserving all URL state
        window.location.reload();
      }
    })
    .catch(() => {});
  }

  // Check once gently after page loads (delayed to avoid interfering with user interaction)
  if (document.readyState === 'complete') {
    setTimeout(checkForUpdates, 3000);
  } else {
    window.addEventListener('load', () => setTimeout(checkForUpdates, 3000));
  }
})();

