// Apply saved theme immediately
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

// Theme toggle functionality
const toggleTheme = () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Initialize theme button
const initializeTheme = () => {
  const themeBtn = document.querySelector('.theme');
  if (!themeBtn) return setTimeout(initializeTheme, 100);
  if (themeBtn.hasAttribute('data-theme-initialized')) return;

  themeBtn.addEventListener('click', toggleTheme);
  themeBtn.setAttribute('data-theme-initialized', 'true');
  window.toggleTheme = toggleTheme;
};

// Event listeners
document.addEventListener('DOMContentLoaded', initializeTheme);
document.addEventListener('component:loaded', (e) => {
  if (e.detail.component === 'navbar') initializeTheme();
});
