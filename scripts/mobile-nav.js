function initializeMobileNav() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav');
  const menuOverlay = document.querySelector('.menu-overlay');
  
  const closeMenu = () => {
    nav?.classList.remove('open');
    menuOverlay?.classList.remove('active');
    mobileMenuBtn?.classList.remove('active');
  };

  const closeSubmenus = () => {
    document.querySelectorAll('.nav-submenu').forEach(m => m.classList.remove('expanded'));
    document.querySelectorAll('.nav-submenu-toggle').forEach(t => t.classList.remove('active'));
  };

  mobileMenuBtn?.addEventListener('click', function() {
    this.classList.toggle('active');
    nav.classList.toggle('open');
    menuOverlay?.classList.toggle('active');
  });

  menuOverlay?.addEventListener('click', closeMenu);

  document.querySelectorAll('.nav-submenu-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      this.classList.toggle('active');
      const submenu = document.getElementById(this.getAttribute('data-target'));
      
      if (window.innerWidth <= 768) {
        document.querySelectorAll('.nav-submenu').forEach(m => {
          if (m !== submenu) m.classList.remove('expanded');
        });
        document.querySelectorAll('.nav-submenu-toggle').forEach(t => {
          if (t !== this) t.classList.remove('active');
        });
      }
      
      submenu?.classList.toggle('expanded');
    });
  });

  document.addEventListener('click', e => {
    if (window.innerWidth <= 768 && !e.target.closest('.nav-item')) {
      closeSubmenus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && nav?.classList.contains('open')) {
      closeMenu();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.mobile-menu-btn')) initializeMobileNav();
});

document.addEventListener('component:loaded', e => {
  if (e.detail.component === 'nav') initializeMobileNav();
});
