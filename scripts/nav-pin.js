document.addEventListener('DOMContentLoaded', () => {
  const navElement = document.querySelector('.nav');
  const pinToggleButton = document.getElementById('navPinBtn');
  const bodyElement = document.body;

  if (navElement && pinToggleButton && bodyElement) {
    // Function to apply/remove pinned state
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

    // Check local storage for saved pin state
    const savedPinState = localStorage.getItem('navPinned');
    if (savedPinState === 'true') {
      setPinnedState(true);
    }

    pinToggleButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default anchor behavior
      const isCurrentlyPinned = navElement.classList.contains('nav-pinned');
      setPinnedState(!isCurrentlyPinned);
      localStorage.setItem('navPinned', (!isCurrentlyPinned).toString());
    });
  }
});
