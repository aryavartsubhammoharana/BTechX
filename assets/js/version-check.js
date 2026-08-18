// Silent Version Update Checker
(function() {
  // Only run on http/https protocols (ignore local file:/// testing)
  if (window.location.protocol.startsWith('file')) return;

  const CURRENT_VERSION = 14.5; // Current client version (Note: Next increments must be decimal: 14 -> 14.1 -> 14.2, etc.)
  const CHECK_INTERVAL = 130000; // Check every 130 seconds (2 mins 10 secs)

  setInterval(() => {
    fetch('/version.json', { cache: 'no-store' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Network response was not ok');
      })
      .then(data => {
        if (data && data.version && data.version > CURRENT_VERSION) {
          console.log(`🚀 New version detected: v${data.version}. Reloading...`);
          window.location.reload(true);
        }
      })
      .catch(err => {
        console.debug('Version check failed:', err);
      });
  }, CHECK_INTERVAL);
})();
