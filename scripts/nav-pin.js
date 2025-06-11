document.addEventListener('DOMContentLoaded', () => {
  const initNavPin = () => {
    const navElement = document.querySelector('.nav');
    const pinToggleButton = document.getElementById('navPinBtn');
    const bodyElement = document.body;

    if (navElement && pinToggleButton && bodyElement) {
      const setPinnedState = (isPinned) => {
        navElement.classList.toggle('nav-pinned', isPinned);
        pinToggleButton.classList.toggle('active', isPinned);
        bodyElement.classList.toggle('nav-is-pinned', isPinned);
        pinToggleButton.setAttribute('aria-pressed', isPinned.toString());
        const pinButtonSpan = pinToggleButton.querySelector('span');
        if (pinButtonSpan) {
          pinButtonSpan.textContent = isPinned ? 'Unpin Menu' : 'Pin Menu';
        }
      };

      const savedPinState = localStorage.getItem('navPinned');
      if (savedPinState === 'true') {
        setPinnedState(true);
      }

      pinToggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        const isCurrentlyPinned = navElement.classList.contains('nav-pinned');
        setPinnedState(!isCurrentlyPinned);
        localStorage.setItem('navPinned', (!isCurrentlyPinned).toString());
      });
    }
  };

  const waitForNav = () => {
    const navElement = document.querySelector('.nav');
    if (navElement) {
      initNavPin();
    } else {
      setTimeout(waitForNav, 50);
    }
  };

  waitForNav();
});
