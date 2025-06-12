// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registered successfully', registration.scope);
        console.log('Registration details:', {
          active: registration.active,
          installing: registration.installing,
          waiting: registration.waiting,
          updateViaCache: registration.updateViaCache,
        });

        // Store registration for manual testing
        window.swRegistration = registration;

        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('📦 SW update found!');
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('📦 New worker installing...', newWorker.state);
            newWorker.addEventListener('statechange', () => {
              console.log(`📦 New worker state changed to: ${newWorker.state}`);
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('🎯 New SW installed with existing controller - showing banner');
                  showUpdateNotification();
                } else {
                  console.log('🎯 New SW installed but no existing controller - first install');
                }
              }
            });
          }
        });

        // Check if there's already a waiting service worker
        if (registration.waiting) {
          console.log('📦 SW already waiting - showing banner immediately');
          showUpdateNotification();
        }

        // Manual update check with better logging
        const checkForUpdates = () => {
          console.log('🔍 Checking for SW updates...');
          console.log('Current registration state:', {
            active: registration.active?.state,
            waiting: registration.waiting?.state,
            installing: registration.installing?.state,
          });

          registration
            .update()
            .then(() => {
              console.log('✅ Update check completed');
              // Check state after update
              setTimeout(() => {
                console.log('Post-update state:', {
                  active: registration.active?.state,
                  waiting: registration.waiting?.state,
                  installing: registration.installing?.state,
                });
              }, 1000);
            })
            .catch((err) => {
              console.error('❌ Update check failed:', err);
            });
        };

        // Check for updates periodically
        setInterval(checkForUpdates, 60000); // Check every minute

        // Also check immediately after 5 seconds
        setTimeout(checkForUpdates, 5000);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Controller changed - reloading page');
      window.location.reload();
    });

    // Add debugging for existing service worker states
    navigator.serviceWorker.ready.then((registration) => {
      console.log('📱 SW ready. States:', {
        active: registration.active?.state,
        waiting: registration.waiting?.state,
        installing: registration.installing?.state,
      });
    });
  });
}

// Manual test function - call this in console to test the banner
window.testUpdateBanner = function () {
  console.log('🧪 Testing update banner manually');
  showUpdateNotification();
};

// Manual update trigger - call this in console to force update check
window.forceUpdateCheck = function () {
  if (window.swRegistration) {
    console.log('🔄 Forcing update check...');
    window.swRegistration.update().then(() => {
      console.log('Force update completed');
    });
  } else {
    console.log('No registration available');
  }
};

function showUpdateNotification() {
  console.log('🎯 showUpdateNotification() called');

  // Prevent multiple banners
  if (document.getElementById('updateBanner')) {
    console.log('🎯 Banner already exists, skipping');
    return;
  }

  console.log('🎯 Creating update banner...');

  const updateBanner = document.createElement('div');
  updateBanner.id = 'updateBanner';
  updateBanner.innerHTML = `
    <div style="
      position: fixed; 
      top: 20px; 
      left: 20px; 
      right: 20px; 
      background-color: rgba(0, 227, 133, 0.9);
      border: 2px solid #00c374;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      color: #121212;
      padding: 20px; 
      z-index: 10000;
      font-family: 'Libre Baskerville', serif;
      font-weight: bold;
      animation: slideDown 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      max-width: 600px;
      margin: 0 auto;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            background-color: #121212;
            color: #00e385;
            border-radius: 8px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            flex-shrink: 0;
          ">UP</div>
          <span style="font-size: 16px;">New content available!</span>
        </div>
        <div style="display: flex; gap: 12px;">
          <button onclick="updateApp()" style="
            background-color: #121212;
            color: #00e385;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-family: 'Libre Baskerville', serif;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s ease;
          " onmouseover="this.style.backgroundColor='#1f1f1f'; this.style.transform='translateY(-2px) scale(1.05)'" onmouseout="this.style.backgroundColor='#121212'; this.style.transform='translateY(0) scale(1)'">
            Update Now
          </button>
          <button onclick="dismissUpdate()" style="
            background-color: transparent;
            color: #121212;
            border: 2px solid #121212;
            border-radius: 8px;
            padding: 10px 18px;
            font-family: 'Libre Baskerville', serif;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s ease;
          " onmouseover="this.style.backgroundColor='rgba(18, 18, 18, 0.1)'; this.style.transform='translateY(-2px) scale(1.05)'" onmouseout="this.style.backgroundColor='transparent'; this.style.transform='translateY(0) scale(1)'">
            Later
          </button>
        </div>
      </div>
    </div>
    <style>
      @keyframes slideDown {
        from { 
          transform: translateY(-100%) scale(0.8); 
          opacity: 0; 
        }
        to { 
          transform: translateY(0) scale(1); 
          opacity: 1; 
        }
      }
    </style>
  `;
  document.body.appendChild(updateBanner);
}

function updateApp() {
  console.log('🔄 Update button clicked');

  // Check if there's a waiting service worker
  if (window.swRegistration && window.swRegistration.waiting) {
    console.log('🔄 Found waiting service worker, sending skip waiting message');
    window.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else if (navigator.serviceWorker.controller) {
    console.log('🔄 Using controller to send skip waiting message');
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  } else {
    console.log('🔄 No service worker available for update');
    // Fallback: just reload the page
    window.location.reload();
  }
}

function dismissUpdate() {
  const banner = document.getElementById('updateBanner');
  if (banner) {
    banner.style.animation = 'slideUp 0.3s ease-out forwards';
    setTimeout(() => {
      banner.remove();
    }, 300);
  }
}

// Add slide up animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { 
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    to { 
      transform: translateY(-100%) scale(0.8);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
