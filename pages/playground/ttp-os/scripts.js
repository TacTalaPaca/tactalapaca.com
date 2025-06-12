// TTP-OS - Clean implementation with working window management
class TTPOS {
  constructor() {
    this.windows = new Map();
    this.windowCounter = 0;
    this.activeWindow = null;
    this.draggedWindow = null;
    this.resizeHandle = null;
    this.dragOffset = { x: 0, y: 0 };
    this.minWindowSize = { width: 200, height: 150 };
    this.snapThreshold = 30;
    this.snapPreview = null;
    this.currentTheme = 'light';

    // Performance optimization flags
    this.isDragging = false;
    this.isResizing = false;
    this.animationFrame = null;

    this.init();
  }
  init() {
    this.setupEventListeners();
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.loadTheme();

    // Debug initialization
    console.log('TTP-OS initialized');
    this.debugMenuStates();

    // Optimize initial paint
    requestAnimationFrame(() => {
      document.body.style.visibility = 'visible';
    });
  }

  debugMenuStates() {
    console.log('Menu debug info:');
    const startMenu = document.getElementById('start-menu');
    const contextMenu = document.getElementById('context-menu');
    const volumeMenu = document.getElementById('volume-menu');

    console.log('Start menu:', startMenu ? 'found' : 'missing', startMenu?.classList.toString());
    console.log('Context menu:', contextMenu ? 'found' : 'missing', contextMenu?.classList.toString());
    console.log('Volume menu:', volumeMenu ? 'found' : 'missing', volumeMenu?.classList.toString());
  }

  setupEventListeners() {
    const startButton = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const desktop = document.getElementById('desktop');

    startButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleStartMenu();
    });

    document.querySelectorAll('.desktop-icon, .app-tile[data-app]').forEach((element) => {
      element.addEventListener('click', () => {
        const appName = element.getAttribute('data-app');
        if (appName) {
          this.openApp(appName);
          this.hideStartMenu();
        }
      });
    });

    desktop.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.hideStartMenu();
      this.showContextMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', (e) => {
      if (startMenu && !startMenu.contains(e.target) && !startButton.contains(e.target)) {
        this.hideStartMenu();
      }
      const contextMenu = document.getElementById('context-menu');
      if (contextMenu && !contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // Context menu actions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.context-item')) {
        const action = e.target.closest('.context-item').getAttribute('data-action');
        this.handleContextMenuAction(action);
        this.hideContextMenu();
      }
    });

    // Window management
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());

    // Prevent default drag behavior
    document.addEventListener('dragstart', (e) => e.preventDefault());

    // Start menu navigation
    const navButtons = document.querySelectorAll('.start-menu-nav .nav-btn');
    navButtons.forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelector('.start-menu-nav .nav-btn.active').classList.remove('active');
        button.classList.add('active');
        document.querySelectorAll('.start-menu-content .tab-content').forEach((tab) => tab.classList.add('hidden'));
        document.getElementById(`${button.dataset.tab}-tab`).classList.remove('hidden');
      });
    });

    // Theme toggle
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    if (themeToggleButton) {
      themeToggleButton.addEventListener('click', () => this.toggleTheme());
    }

    // System tray functionality
    document.querySelectorAll('[data-menu]').forEach((element) => {
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuId = element.getAttribute('data-menu');
        this.toggleTrayMenu(menuId);
      });
    });

    // Close tray menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tray-menu') && !e.target.closest('[data-menu]')) {
        this.hideAllTrayMenus();
      }
    });

    // Volume slider functionality
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.updateVolume(e.target.value);
      });
    }

    // Power action handlers
    document.querySelectorAll('[data-action]').forEach((element) => {
      element.addEventListener('click', (e) => {
        const action = element.getAttribute('data-action');
        this.handlePowerAction(action);
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }
  toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    if (!startMenu) return;

    if (startMenu.classList.contains('hidden') || !startMenu.classList.contains('show')) {
      // Show the menu
      this.hideContextMenu();
      this.hideAllTrayMenus();
      startMenu.classList.remove('hidden');
      requestAnimationFrame(() => {
        startMenu.classList.add('show');
      });
    } else {
      // Hide the menu
      this.hideStartMenu();
    }
  }

  hideStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.remove('show');
    setTimeout(() => startMenu.classList.add('hidden'), 200);
  }

  showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;

    contextMenu.classList.remove('hidden');
    contextMenu.style.visibility = 'hidden';
    contextMenu.style.opacity = '0';

    const menuRect = contextMenu.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const taskbarHeight = 64;

    if (x + menuRect.width > screenWidth - 10) {
      x = screenWidth - menuRect.width - 10;
    }
    if (y + menuRect.height > screenHeight - taskbarHeight - 10) {
      y = screenHeight - menuRect.height - taskbarHeight - 10;
    }

    x = Math.max(10, x);
    y = Math.max(10, y);

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.visibility = 'visible';

    requestAnimationFrame(() => {
      contextMenu.classList.add('show');
    });
  }

  hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;

    contextMenu.classList.remove('show');
    setTimeout(() => {
      contextMenu.classList.add('hidden');
    }, 120);
  }
  handleContextMenuAction(action) {
    switch (action) {
      case 'refresh':
        this.showNotification('Desktop', 'Desktop refreshed successfully');
        break;
      case 'new-folder':
        this.showNotification('New Folder', 'New folder created on desktop');
        break;
      case 'paste':
        this.showNotification('Clipboard', 'Paste operation completed');
        break;
      case 'sort':
        this.showNotification('Sort', 'Desktop icons sorted');
        break;
      case 'properties':
        this.openApp('settings');
        break;
      default:
        this.showNotification('Action', `Performed: ${action}`);
    }
  }

  openApp(appName) {
    const windowId = `window-${this.windowCounter++}`;
    const windowData = this.createWindow(windowId, appName);
    const windowElement = windowData.element;

    document.getElementById('windows-container').appendChild(windowElement);
    this.windows.set(windowId, windowData);
    this.focusWindow(windowId);

    setTimeout(() => {
      windowElement.classList.add('show');
    }, 10);

    this.addToTaskbar(windowId, appName, windowData.icon);
    this.hideStartMenu();
  }

  createWindow(windowId, appName) {
    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.id = windowId;

    const initialX = 100 + (this.windows.size % 10) * 30;
    const initialY = 50 + (this.windows.size % 10) * 30;
    windowElement.style.left = `${initialX}px`;
    windowElement.style.top = `${initialY}px`;
    windowElement.style.width = '700px';
    windowElement.style.height = '500px';

    const appData = this.getAppData(appName);

    windowElement.innerHTML = `
      <div class="window-header" data-window-id="${windowId}">
        <div class="window-title-icon"><i class="${appData.icon}"></i></div>
        <div class="window-title">${appData.title}</div>
        <div class="window-controls">
          <div class="window-control minimize" data-action="minimize" title="Minimize"></div>
          <div class="window-control maximize" data-action="maximize" title="Maximize"></div>
          <div class="window-control close" data-action="close" title="Close"></div>
        </div>
      </div>
      <div class="window-content">
        ${appData.content}
      </div>
      <div class="resize-handle resize-n"></div>
      <div class="resize-handle resize-ne"></div>
      <div class="resize-handle resize-e"></div>
      <div class="resize-handle resize-se"></div>
      <div class="resize-handle resize-s"></div>
      <div class="resize-handle resize-sw"></div>
      <div class="resize-handle resize-w"></div>
      <div class="resize-handle resize-nw"></div>
    `;

    // Add window control listeners
    windowElement.querySelector('.window-controls').addEventListener('click', (e) => {
      if (e.target.classList.contains('window-control')) {
        const action = e.target.dataset.action;
        this.handleWindowAction(windowId, action, windowElement);
      }
    });

    // Focus window on click
    windowElement.addEventListener(
      'mousedown',
      (e) => {
        this.focusWindow(windowId);
      },
      true
    );

    // Initialize app-specific JS if any
    if (appData.init) {
      appData.init(windowElement);
    }

    return {
      element: windowElement,
      appName,
      title: appData.title,
      icon: appData.icon,
      isMinimized: false,
      isMaximized: false,
      previousGeometry: null,
    };
  }

  getAppData(appName) {
    const apps = {
      'file-manager': {
        title: 'File Explorer',
        icon: 'fas fa-folder-open',
        content: '<div style="padding:20px;">File Explorer Content - Coming Soon!</div>',
      },
      'text-editor': {
        title: 'TextPad',
        icon: 'fas fa-file-alt',
        content: `
          <div class="text-editor-app">
            <div class="editor-menu">
              <button>File</button>
              <button>Edit</button>
              <button>View</button>
            </div>
            <textarea id="text-editor-area" placeholder="Start typing..."></textarea>
          </div>
        `,
      },
      browser: {
        title: 'Web Voyager',
        icon: 'fas fa-compass',
        content: `
          <div class="browser-app">
            <div class="browser-nav">
              <button><i class="fas fa-arrow-left"></i></button>
              <button><i class="fas fa-arrow-right"></i></button>
              <button><i class="fas fa-sync-alt"></i></button>
              <input type="text" class="address-bar" placeholder="Enter URL">
              <button><i class="fas fa-home"></i></button>
            </div>
            <div class="browser-content">
              <div style="padding: 20px; text-align: center;">Browser Content Area</div>
            </div>
          </div>
        `,
      },
      calculator: {
        title: 'Calculator',
        icon: 'fas fa-calculator',
        content: `
          <div class="calculator-app">
            <div class="calc-display-container">
              <input type="text" id="calc-display" value="0" readonly>
            </div>
            <div class="calc-buttons">
              <button class="calc-btn clear">C</button>
              <button class="calc-btn">±</button>
              <button class="calc-btn">%</button>
              <button class="calc-btn operator">÷</button>
              <button class="calc-btn">7</button>
              <button class="calc-btn">8</button>
              <button class="calc-btn">9</button>
              <button class="calc-btn operator">×</button>
              <button class="calc-btn">4</button>
              <button class="calc-btn">5</button>
              <button class="calc-btn">6</button>
              <button class="calc-btn operator">-</button>
              <button class="calc-btn">1</button>
              <button class="calc-btn">2</button>
              <button class="calc-btn">3</button>
              <button class="calc-btn operator">+</button>
              <button class="calc-btn">0</button>
              <button class="calc-btn">.</button>
              <button class="calc-btn equals">=</button>
            </div>
          </div>
        `,
        init: (windowElement) => {
          let currentValue = '0';
          let operator = null;
          let waitingForOperand = false;
          const display = windowElement.querySelector('#calc-display');

          windowElement.querySelectorAll('.calc-btn').forEach((button) => {
            button.addEventListener('click', () => {
              const value = button.textContent;

              if (button.classList.contains('clear')) {
                currentValue = '0';
                operator = null;
                waitingForOperand = false;
              } else if (button.classList.contains('equals')) {
                // Handle equals
                display.value = currentValue;
              } else if (button.classList.contains('operator')) {
                operator = value;
                waitingForOperand = true;
              } else {
                if (waitingForOperand || currentValue === '0') {
                  currentValue = value;
                  waitingForOperand = false;
                } else {
                  currentValue += value;
                }
              }

              display.value = currentValue;
            });
          });
        },
      },
      terminal: {
        title: 'Terminal',
        icon: 'fas fa-terminal',
        content: `
          <div class="terminal-app">
            <div id="terminal-output">
              <div>TTP-OS Terminal v1.0</div>
              <div>Type 'help' for available commands</div>
              <div class="prompt-line">
                <span class="prompt-user">user@ttp-os:~$</span>
                <input type="text" autocomplete="off">
              </div>
            </div>
          </div>
        `,
      },
      'media-player': {
        title: 'Media Player',
        icon: 'fas fa-play-circle',
        content: '<div style="padding:20px;">Media Player - Coming Soon!</div>',
      },
      'image-viewer': {
        title: 'Image Viewer',
        icon: 'fas fa-image',
        content: '<div style="padding:20px;">Image Viewer - Coming Soon!</div>',
      },
      settings: {
        title: 'Settings',
        icon: 'fas fa-cog',
        content: `
          <div style="padding:20px;">
            <h3>TTP-OS Settings</h3>
            <p>Theme: <button onclick="window.ttpOSInstance.toggleTheme()">Toggle Theme</button></p>
            <p>Version: 1.0.0</p>
          </div>
        `,
      },
    };

    return (
      apps[appName] || {
        title: 'Unknown App',
        icon: 'fas fa-window-maximize',
        content: '<div style="padding:20px;">Unknown application</div>',
      }
    );
  }

  handleWindowAction(windowId, action, windowElement) {
    const windowData = this.windows.get(windowId);
    if (!windowData) return;

    switch (action) {
      case 'close':
        this.closeWindow(windowId);
        break;
      case 'minimize':
        this.minimizeWindow(windowId, windowElement, windowData);
        break;
      case 'maximize':
        this.toggleMaximizeWindow(windowId, windowElement, windowData);
        break;
    }
  }
  minimizeWindow(windowId, windowElement, windowData) {
    windowElement.classList.add('minimized');
    windowData.isMinimized = true;

    this.updateTaskbarButton(windowId, false, true);

    if (this.activeWindow === windowElement) {
      this.activeWindow = null;
      windowElement.classList.remove('active-window');

      const nextWindow = Array.from(this.windows.values()).find((wd) => wd.element !== windowElement && !wd.isMinimized);
      if (nextWindow) {
        this.focusWindow(nextWindow.element.id);
      }
    }

    // Show feedback notification
    this.showNotification('Window', `${windowData.title} minimized`, 1500);
  }
  toggleMaximizeWindow(windowId, windowElement, windowData) {
    if (windowData.isMaximized) {
      // Restore window
      if (windowData.previousGeometry) {
        windowElement.style.left = windowData.previousGeometry.left;
        windowElement.style.top = windowData.previousGeometry.top;
        windowElement.style.width = windowData.previousGeometry.width;
        windowElement.style.height = windowData.previousGeometry.height;
      }
      windowData.isMaximized = false;
      windowElement.classList.remove('maximized-window');
      this.showNotification('Window', `${windowData.title} restored`, 1500);
    } else {
      // Store current geometry before maximizing
      const desktop = document.getElementById('desktop');
      windowData.previousGeometry = {
        left: windowElement.style.left || windowElement.offsetLeft + 'px',
        top: windowElement.style.top || windowElement.offsetTop + 'px',
        width: windowElement.style.width || windowElement.offsetWidth + 'px',
        height: windowElement.style.height || windowElement.offsetHeight + 'px',
      };

      // Maximize window to desktop area
      windowElement.style.left = '0px';
      windowElement.style.top = '0px';
      windowElement.style.width = `${desktop.clientWidth}px`;
      windowElement.style.height = `${desktop.clientHeight}px`;
      windowData.isMaximized = true;
      windowElement.classList.add('maximized-window');
      this.showNotification('Window', `${windowData.title} maximized`, 1500);
    }
  }

  closeWindow(windowId) {
    const windowData = this.windows.get(windowId);
    if (windowData) {
      windowData.element.classList.remove('show');
      windowData.element.classList.add('closing');
      setTimeout(() => {
        windowData.element.remove();
        this.windows.delete(windowId);
        this.removeFromTaskbar(windowId);
        if (this.activeWindow === windowData.element) {
          this.activeWindow = null;
          const nextWindow = Array.from(this.windows.values()).pop();
          if (nextWindow && !nextWindow.isMinimized) this.focusWindow(nextWindow.element.id);
        }
      }, 120);
    }
  }

  focusWindow(windowId) {
    const windowData = this.windows.get(windowId);
    if (!windowData) return;

    if (windowData.isMinimized) {
      windowData.element.classList.remove('minimized');
      windowData.isMinimized = false;
    }

    if (this.activeWindow && this.activeWindow !== windowData.element) {
      this.activeWindow.classList.remove('active-window');
      this.activeWindow.style.zIndex = 500;
      this.updateTaskbarButton(this.activeWindow.id, false);
    }

    this.activeWindow = windowData.element;
    this.activeWindow.classList.add('active-window');
    this.activeWindow.style.zIndex = 1000;

    this.windows.forEach((wd) => {
      if (wd.element !== this.activeWindow) {
        wd.element.style.zIndex = 500;
      }
    });

    this.updateTaskbarButton(windowId, true);
    this.hideStartMenu();
  }

  addToTaskbar(windowId, appName, appIconClass) {
    const taskbarApps = document.getElementById('taskbar-apps');
    const button = document.createElement('button');
    button.className = 'taskbar-app';
    button.id = `taskbar-${windowId}`;
    button.innerHTML = `<i class="${appIconClass || 'fas fa-window-maximize'}"></i> <span class="taskbar-app-title">${this.windows.get(windowId).title}</span>`;
    button.onclick = () => this.focusWindow(windowId);
    taskbarApps.appendChild(button);
  }

  removeFromTaskbar(windowId) {
    const button = document.getElementById(`taskbar-${windowId}`);
    if (button) button.remove();
  }

  updateTaskbarButton(windowId, isActive, isMinimized = false) {
    const button = document.getElementById(`taskbar-${windowId}`);
    if (button) {
      if (isActive) {
        button.classList.add('active');
        button.classList.remove('minimized');
      } else {
        button.classList.remove('active');
        if (isMinimized) {
          button.classList.add('minimized');
        } else {
          button.classList.remove('minimized');
        }
      }
    }
  }

  handleMouseDown(e) {
    const windowElement = e.target.closest('.window');

    if (windowElement) {
      this.focusWindow(windowElement.id);

      if (e.target.closest('.window-content input, .window-content textarea, .window-content button, .calc-buttons')) {
        return;
      }

      if (e.target.classList.contains('resize-handle')) {
        this.resizeHandle = e.target;
        this.isResizing = true;
        windowElement.classList.add('resizing');

        this.dragOffset = {
          x: e.clientX,
          y: e.clientY,
          width: parseInt(windowElement.style.width, 10) || windowElement.offsetWidth,
          height: parseInt(windowElement.style.height, 10) || windowElement.offsetHeight,
          left: parseInt(windowElement.style.left, 10) || windowElement.offsetLeft,
          top: parseInt(windowElement.style.top, 10) || windowElement.offsetTop,
        };

        e.preventDefault();
        return;
      }

      if (e.target.closest('.window-header')) {
        this.draggedWindow = windowElement;
        this.isDragging = true;
        windowElement.classList.add('dragging');

        const rect = windowElement.getBoundingClientRect();
        this.dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        windowElement.style.transform = '';
        e.preventDefault();
        return;
      }
    }
  }

  handleMouseMove(e) {
    if (this.draggedWindow && this.isDragging) {
      this.updateWindowPosition(e);
    } else if (this.resizeHandle && this.isResizing) {
      this.updateWindowSize(e);
    }
  }

  updateWindowPosition(e) {
    if (!this.draggedWindow) return;

    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();

    let newX = e.clientX - this.dragOffset.x;
    let newY = e.clientY - this.dragOffset.y;

    const minVisibleArea = 32;
    newX = Math.max(-this.draggedWindow.offsetWidth + minVisibleArea, Math.min(newX, desktopRect.width - minVisibleArea));
    newY = Math.max(0, Math.min(newY, desktopRect.height - minVisibleArea));

    this.draggedWindow.style.left = `${newX}px`;
    this.draggedWindow.style.top = `${newY}px`;
  }

  updateWindowSize(e) {
    const windowElement = this.resizeHandle.closest('.window');
    if (!windowElement) return;

    let newWidth = this.dragOffset.width;
    let newHeight = this.dragOffset.height;
    let newLeft = this.dragOffset.left;
    let newTop = this.dragOffset.top;

    const dx = e.clientX - this.dragOffset.x;
    const dy = e.clientY - this.dragOffset.y;

    if (this.resizeHandle.classList.contains('resize-e')) {
      newWidth = Math.max(this.minWindowSize.width, this.dragOffset.width + dx);
    } else if (this.resizeHandle.classList.contains('resize-w')) {
      newWidth = Math.max(this.minWindowSize.width, this.dragOffset.width - dx);
      newLeft = this.dragOffset.left + dx;
    } else if (this.resizeHandle.classList.contains('resize-s')) {
      newHeight = Math.max(this.minWindowSize.height, this.dragOffset.height + dy);
    } else if (this.resizeHandle.classList.contains('resize-n')) {
      newHeight = Math.max(this.minWindowSize.height, this.dragOffset.height - dy);
      newTop = this.dragOffset.top + dy;
    } else if (this.resizeHandle.classList.contains('resize-se')) {
      newWidth = Math.max(this.minWindowSize.width, this.dragOffset.width + dx);
      newHeight = Math.max(this.minWindowSize.height, this.dragOffset.height + dy);
    } else if (this.resizeHandle.classList.contains('resize-sw')) {
      newWidth = Math.max(this.minWindowSize.width, this.dragOffset.width - dx);
      newLeft = this.dragOffset.left + dx;
      newHeight = Math.max(this.minWindowSize.height, this.dragOffset.height + dy);
    } else if (this.resizeHandle.classList.contains('resize-ne')) {
      newWidth = Math.max(this.minWindowSize.width, this.dragOffset.width + dx);
      newHeight = Math.max(this.minWindowSize.height, this.dragOffset.height - dy);
      newTop = this.dragOffset.top + dy;
    } else if (this.resizeHandle.classList.contains('resize-nw')) {
      newWidth = Math.max(this.minWindowSize.width, this.dragOffset.width - dx);
      newLeft = this.dragOffset.left + dx;
      newHeight = Math.max(this.minWindowSize.height, this.dragOffset.height - dy);
      newTop = this.dragOffset.top + dy;
    }

    if (newWidth >= this.minWindowSize.width) {
      windowElement.style.width = `${newWidth}px`;
      if (this.resizeHandle.classList.contains('resize-w') || this.resizeHandle.classList.contains('resize-nw') || this.resizeHandle.classList.contains('resize-sw')) {
        windowElement.style.left = `${newLeft}px`;
      }
    }

    if (newHeight >= this.minWindowSize.height) {
      windowElement.style.height = `${newHeight}px`;
      if (this.resizeHandle.classList.contains('resize-n') || this.resizeHandle.classList.contains('resize-ne') || this.resizeHandle.classList.contains('resize-nw')) {
        windowElement.style.top = `${newTop}px`;
      }
    }
  }

  handleMouseUp() {
    if (this.draggedWindow) {
      this.draggedWindow.classList.remove('dragging');
      this.draggedWindow = null;
    }

    if (this.resizeHandle) {
      const windowElement = this.resizeHandle.closest('.window');
      if (windowElement) {
        windowElement.classList.remove('resizing');
      }
      this.resizeHandle = null;
    }

    this.isDragging = false;
    this.isResizing = false;

    document.body.style.cursor = 'default';
  }

  updateClock() {
    const now = new Date();
    const timeElem = document.querySelector('#clock .time');
    const dateElem = document.querySelector('#clock .date');

    if (timeElem) timeElem.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (dateElem) dateElem.textContent = now.toLocaleDateString();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', this.currentTheme === 'dark');
    localStorage.setItem('ttpOSTheme', this.currentTheme);
    this.updateThemeIcon();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('ttpOSTheme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
      document.body.classList.toggle('dark-mode', this.currentTheme === 'dark');
    }
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    if (themeToggleButton) {
      themeToggleButton.innerHTML = this.currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  }
  toggleTrayMenu(menuId) {
    const menu = document.getElementById(menuId + '-menu');
    if (!menu) {
      console.warn(`Tray menu not found: ${menuId}-menu`);
      return;
    }

    // Close other menus first
    this.hideStartMenu();
    this.hideContextMenu();
    this.hideAllTrayMenus();

    // Show this menu
    menu.classList.remove('hidden');
    requestAnimationFrame(() => {
      menu.classList.add('show');
    });
  }

  hideAllTrayMenus() {
    document.querySelectorAll('.tray-menu').forEach((menu) => {
      menu.classList.remove('show');
      setTimeout(() => menu.classList.add('hidden'), 150);
    });
  }

  updateVolume(value) {
    console.log(`Volume set to: ${value}%`);
  }

  handlePowerAction(action) {
    console.log(`Power action: ${action}`);
    this.hideAllTrayMenus();
  }

  handleKeyboard(e) {
    switch (e.key) {
      case 'Escape':
        this.hideStartMenu();
        this.hideContextMenu();
        this.hideAllTrayMenus();
        break;
      case 'F11':
        e.preventDefault();
        this.toggleFullscreen();
        break;
      case 'Tab':
        if (e.altKey) {
          e.preventDefault();
          this.switchToNextWindow();
        }
        break;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  switchToNextWindow() {
    const windows = Array.from(this.windows.values()).filter((wd) => !wd.isMinimized);
    if (windows.length <= 1) return;

    const currentIndex = windows.findIndex((wd) => wd.element === this.activeWindow);
    const nextIndex = (currentIndex + 1) % windows.length;
    this.focusWindow(windows[nextIndex].element.id);
  }

  showNotification(title, message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto hide
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
}

// Helper for resize cursor
document.addEventListener('mousemove', (e) => {
  if (e.target.classList.contains('resize-handle')) {
    const handleType = e.target.className.split(' ').find((cls) => cls.startsWith('resize-'));
    switch (handleType) {
      case 'resize-n':
      case 'resize-s':
        document.body.style.cursor = 'ns-resize';
        break;
      case 'resize-e':
      case 'resize-w':
        document.body.style.cursor = 'ew-resize';
        break;
      case 'resize-ne':
      case 'resize-sw':
        document.body.style.cursor = 'nesw-resize';
        break;
      case 'resize-nw':
      case 'resize-se':
        document.body.style.cursor = 'nwse-resize';
        break;
      default:
        document.body.style.cursor = 'default';
        break;
    }
  } else if (window.ttpOSInstance && !window.ttpOSInstance.draggedWindow && !window.ttpOSInstance.resizeHandle) {
    document.body.style.cursor = 'default';
  }
});

// Initialize the OS
document.addEventListener('DOMContentLoaded', () => {
  window.ttpOSInstance = new TTPOS();
});
