// BTechX - Non-Intrusive Smart Auto-Update & Cache Syncer (v16.7)
(function() {
  // Ignore local file:/// testing
  if (window.location.protocol.startsWith('file')) return;

  const APP_VERSION = 16.7;
  const isViewer = window.location.pathname.includes('viewer.html');
  const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds

  function getVersionUrl() {
    const isSub = window.location.pathname.includes('/1stYearSub/') || window.location.pathname.includes('/2ndYearSub/');
    return (isSub ? '../version.json' : 'version.json') + '?_t=' + Date.now();
  }

  // Check if an update was pending from a previous viewer session
  function checkPendingUpdate() {
    if (isViewer) return false; // Do not apply on viewer while open

    try {
      const pendingRaw = localStorage.getItem('btechx_pending_update');
      if (pendingRaw) {
        localStorage.removeItem('btechx_pending_update');
        console.log('🔄 Applying deferred update after exiting PDF viewer...');
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          }).catch(() => {});
        }
        window.location.reload();
        return true;
      }
    } catch (e) {}
    return false;
  }

  function handleNewVersion(remoteVersion) {
    const lastSynced = parseFloat(localStorage.getItem('btechx_synced_version') || '0');
    if (lastSynced >= remoteVersion) return; // Already on this version

    if (isViewer) {
      // 🛡️ STUDENT SAFEGUARD: NEVER disrupt active PDF reading!
      // Mark as pending; will apply smoothly as soon as student exits PDF viewer.
      try {
        localStorage.setItem('btechx_pending_update', JSON.stringify({
          version: remoteVersion,
          detectedAt: Date.now()
        }));
        console.log(`📦 Update v${remoteVersion} detected. Held back until student exits PDF.`);
      } catch (e) {}
      return;
    }

    // On non-viewer pages: apply update cleanly without disruption
    try {
      localStorage.setItem('btechx_synced_version', remoteVersion.toString());
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        }).catch(() => {});
      }
      console.log(`🚀 New version v${remoteVersion} synced. Reloading to latest...`);
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  }

  function fetchLatestVersion() {
    fetch(getVersionUrl(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Status: ' + res.status);
      return res.json();
    })
    .then(data => {
      if (data && typeof data.version === 'number') {
        if (data.version > APP_VERSION) {
          handleNewVersion(data.version);
        }
      }
    })
    .catch(() => {});
  }

  // 1. Immediately check if an update is pending from an exited viewer session
  if (!checkPendingUpdate()) {
    // 2. Initial gentle check after page load
    setTimeout(fetchLatestVersion, 3500);
  }

  // 3. Periodic background check
  setInterval(fetchLatestVersion, CHECK_INTERVAL_MS);

  // 4. When tab becomes visible again or page is restored from bfcache
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!checkPendingUpdate()) {
        fetchLatestVersion();
      }
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      checkPendingUpdate();
    }
  });
})();
