// Navbar Component

import { t, i18n, Language } from '../i18n';
import { auth } from '../utils/auth';

export function renderNavbar(): void {
  const app = document.getElementById('app');
  if (!app) return;

  // Create navbar container if it doesn't exist
  let navContainer = document.getElementById('navbar-container');
  if (!navContainer) {
    navContainer = document.createElement('div');
    navContainer.id = 'navbar-container';
    app.insertBefore(navContainer, app.firstChild);
  }

  const currentPath = window.location.pathname;
  const isLoggedIn = auth.isAuthenticated();
  const user = auth.getUser();

  navContainer.innerHTML = `
    <!-- Mobile Overlay -->
    <div id="mobile-overlay" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>

    <!-- Mobile Slide-out Sidebar -->
    <div id="mobile-sidebar" class="fixed top-0 left-0 h-full w-64 bg-pong-dark border-r border-white/10 z-50 transform -translate-x-full transition-transform duration-300 md:hidden">
      <div class="p-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <a href="/" data-link class="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" class="h-10 w-auto" />
            <span class="font-game text-sm text-pong-primary">TRANSCENDER SUPREME</span>
          </a>
          <button id="close-sidebar-btn" class="text-white/60 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="p-4 space-y-4">
        <a href="/" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary ${currentPath === '/' ? 'text-pong-primary' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span>${t('nav.home')}</span>
        </a>
        <a href="/game" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary ${currentPath === '/game' ? 'text-pong-primary' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>${t('nav.play')}</span>
        </a>
        <a href="/tournament" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary ${currentPath === '/tournament' ? 'text-pong-primary' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>${t('nav.tournament')}</span>
        </a>
        <a href="/dashboard" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary ${currentPath === '/dashboard' ? 'text-pong-primary' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <span>${t('nav.dashboard')}</span>
        </a>
        ${isLoggedIn ? `
          <a href="/friends" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary ${currentPath === '/friends' ? 'text-pong-primary' : ''}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <span>${t('profile.friends')}</span>
          </a>
          <a href="/profile" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary ${currentPath === '/profile' ? 'text-pong-primary' : ''}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span>${t('nav.profile')}</span>
          </a>
          <a href="/settings" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary ${currentPath === '/settings' ? 'text-pong-primary' : ''}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span>${t('nav.settings')}</span>
          </a>
          <hr class="border-white/10" />
          <button id="sidebar-logout-btn" class="flex items-center space-x-3 py-2 text-red-400 hover:text-red-300 w-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span>${t('nav.logout')}</span>
          </button>
        ` : `
          <hr class="border-white/10" />
          <a href="/login" data-link class="flex items-center space-x-3 py-2 text-white hover:text-pong-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span>${t('auth.login')}</span>
          </a>
          <a href="/register" data-link class="flex items-center space-x-3 py-2 text-pong-primary hover:text-pong-light">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            <span>${t('auth.register')}</span>
          </a>
        `}
        <hr class="border-white/10" />
        <div class="py-2">
          <label class="text-white/60 text-sm mb-2 block">${t('settings.language')}</label>
          <select id="mobile-language-selector" class="w-full bg-pong-darker border border-white/20 rounded px-3 py-2 text-white">
            ${i18n.getAvailableLanguages().map(lang => `
              <option value="${lang.code}" ${i18n.getLanguage() === lang.code ? 'selected' : ''}>
                ${lang.name}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Main Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-30 glass border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 md:h-24">
          <!-- Mobile: Hamburger + Logo -->
          <div class="flex items-center space-x-4">
            <button id="mobile-menu-btn" class="md:hidden text-white hover:text-pong-primary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <a href="/" data-link class="flex items-center space-x-2 md:space-x-4">
              <img src="/logo.png" alt="Logo" class="h-10 md:h-20 w-auto animate-float" />
              <span class="md:hidden font-game text-xs text-pong-primary">TRANSCENDER SUPREME</span>
              <span class="hidden md:inline font-game text-xl font-bold text-pong-primary glow-text tracking-wider">TRANSCENDER SUPREME</span>
            </a>
          </div>

          <!-- Desktop Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a href="/" data-link class="nav-link ${currentPath === '/' ? 'nav-link-active' : ''}">${t('nav.home')}</a>
            <a href="/game" data-link class="nav-link ${currentPath === '/game' ? 'nav-link-active' : ''}">${t('nav.play')}</a>
            <a href="/tournament" data-link class="nav-link ${currentPath === '/tournament' ? 'nav-link-active' : ''}">${t('nav.tournament')}</a>
            <a href="/dashboard" data-link class="nav-link ${currentPath === '/dashboard' ? 'nav-link-active' : ''}">${t('nav.dashboard')}</a>
            ${isLoggedIn ? `
              <a href="/friends" data-link class="nav-link ${currentPath === '/friends' ? 'nav-link-active' : ''}">${t('profile.friends')}</a>
              <a href="/profile" data-link class="nav-link ${currentPath === '/profile' ? 'nav-link-active' : ''}">${t('nav.profile')}</a>
            ` : ''}
          </div>

          <!-- Right side: Language & Auth (Desktop) -->
          <div class="hidden md:flex items-center space-x-4">
            <select id="language-selector" class="bg-transparent border border-pong-light rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-pong-primary cursor-pointer">
              ${i18n.getAvailableLanguages().map(lang => `
                <option value="${lang.code}" ${i18n.getLanguage() === lang.code ? 'selected' : ''} class="bg-pong-dark">
                  ${lang.name}
                </option>
              `).join('')}
            </select>

            ${isLoggedIn ? `
              <div class="flex items-center space-x-3">
                <a href="/settings" data-link class="text-white/80 hover:text-white">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </a>

                <!-- Notifications -->
                <div class="relative group" id="notifications-wrapper">
                  <button id="notifications-btn" class="relative text-white/80 hover:text-white p-1">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <span id="notification-badge" class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full hidden">0</span>
                  </button>
                  <div id="notifications-dropdown" class="absolute right-0 top-full mt-2 w-80 bg-pong-dark border border-pong-light rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-96 overflow-y-auto z-50">
                    <div class="p-3 border-b border-white/10 font-game text-xs text-white/60 uppercase">
                      ${t('notifications.title')}
                    </div>
                    <div id="notifications-list" class="py-1">
                      <div class="p-4 text-center text-white/40 text-sm">
                        ${t('notifications.noNotifications')}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="relative group">
                  <button class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div class="w-8 h-8 rounded-full bg-pong-primary/20 flex items-center justify-center border-2 border-pong-primary overflow-hidden">
                      ${user?.avatarUrl && user.avatarUrl !== '/default-avatar.png'
        ? `<img src="${user.avatarUrl}" alt="${user.displayName}" class="w-full h-full object-cover" />`
        : `<img src="/default-avatar.png" alt="${user.displayName}" class="w-full h-full object-cover" />`
      }
                    </div>
                    <span class="text-sm text-white">${user?.displayName || user?.username || 'User'}</span>
                  </button>
                  <div class="absolute right-0 top-full mt-2 w-48 bg-pong-dark border border-pong-light rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <a href="/profile" data-link class="block px-4 py-2 text-white hover:bg-pong-light/50 rounded-t-lg">${t('nav.profile')}</a>
                    <a href="/settings" data-link class="block px-4 py-2 text-white hover:bg-pong-light/50">${t('nav.settings')}</a>
                    <button id="logout-btn" class="w-full text-left px-4 py-2 text-red-400 hover:bg-pong-light/50 rounded-b-lg">${t('nav.logout')}</button>
                  </div>
                </div>
              </div>
            ` : `
              <div class="flex items-center space-x-2">
                <a href="/login" data-link class="btn btn-secondary text-sm py-2">${t('auth.login')}</a>
                <a href="/register" data-link class="btn btn-primary text-sm py-2">${t('auth.register')}</a>
              </div>
            `}
          </div>

          <!-- Mobile: User Avatar or Login -->
          <div class="md:hidden">
            ${isLoggedIn ? `
              <a href="/profile" data-link class="w-8 h-8 rounded-full bg-pong-primary/20 flex items-center justify-center border-2 border-pong-primary overflow-hidden">
                ${user?.avatarUrl && user.avatarUrl !== '/default-avatar.png'
        ? `<img src="${user.avatarUrl}" alt="${user.displayName}" class="w-full h-full object-cover" />`
        : `<img src="/default-avatar.png" alt="${user.displayName}" class="w-full h-full object-cover" />`
      }
              </a>
            ` : `
              <a href="/login" data-link class="text-pong-primary text-sm font-medium">${t('auth.login')}</a>
            `}
          </div>
        </div>
      </div>
    </nav>
    <div class="h-16 md:h-24"></div> <!-- Spacer for fixed navbar -->
  `;

  // Mobile sidebar toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileSidebar = document.getElementById('mobile-sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');

  const openSidebar = () => {
    mobileSidebar?.classList.remove('-translate-x-full');
    mobileOverlay?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    mobileSidebar?.classList.add('-translate-x-full');
    mobileOverlay?.classList.add('hidden');
    document.body.style.overflow = '';
  };

  mobileBtn?.addEventListener('click', openSidebar);
  closeSidebarBtn?.addEventListener('click', closeSidebar);
  mobileOverlay?.addEventListener('click', closeSidebar);

  // Close sidebar on navigation
  mobileSidebar?.querySelectorAll('a[data-link]').forEach(link => {
    link.addEventListener('click', closeSidebar);
  });

  // Language selectors
  const langSelector = document.getElementById('language-selector') as HTMLSelectElement;
  const mobileLangSelector = document.getElementById('mobile-language-selector') as HTMLSelectElement;

  const handleLangChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const isInGame = currentPath === '/game' && (urlParams.has('mode') || urlParams.has('matchId'));

    if (isInGame) {
      alert(t('game.langChangeWarning'));
      target.value = i18n.getLanguage();
      return;
    }

    i18n.setLanguage(target.value as Language);
    closeSidebar();
    renderNavbar();
  };

  if (langSelector) langSelector.onchange = handleLangChange;
  if (mobileLangSelector) mobileLangSelector.onchange = handleLangChange;

  // Logout buttons
  const logoutBtn = document.getElementById('logout-btn');
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');

  const handleLogout = async () => {
    closeSidebar();
    await auth.logout();
    renderNavbar();
  };

  if (logoutBtn) logoutBtn.onclick = handleLogout;
  if (sidebarLogoutBtn) sidebarLogoutBtn.onclick = handleLogout;

  // Notification Logic
  if (isLoggedIn) {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000);

    // Mark system notifications as read when dropdown is opened
    const notificationsBtn = document.getElementById('notifications-btn');
    if (notificationsBtn) {
      notificationsBtn.onclick = async () => {
        const list = document.getElementById('notifications-list');
        if (!list) return;

        // Find unread system notifications
        const unreadSystemNotifs = list.querySelectorAll('div[data-type="system"][data-status="unread"]');

        if (unreadSystemNotifs.length > 0) {
          const { api } = await import('../utils/api');
          // Mark each as read
          unreadSystemNotifs.forEach(async (el) => {
            const id = el.getAttribute('data-id');
            if (id) {
              await api.put(`/users/notifications/${id}/read`, {});
              // Update UI
              el.setAttribute('data-status', 'read');
              el.classList.remove('bg-pong-primary/5');
            }
          });

          // Update badge count
          const badge = document.getElementById('notification-badge');
          if (badge) {
            const currentCount = parseInt(badge.textContent || '0');
            const newCount = Math.max(0, currentCount - unreadSystemNotifs.length);
            if (newCount > 0) {
              badge.textContent = newCount > 9 ? '9+' : newCount.toString();
            } else {
              badge.classList.add('hidden');
            }
          }
        }
      };
    }
  }
}

async function fetchNotifications(): Promise<void> {
  const badge = document.getElementById('notification-badge');
  const list = document.getElementById('notifications-list');
  const { api } = await import('../utils/api');

  try {
    const result = await api.get<{ notifications: any[] }>('/users/notifications');
    if (result.success && result.data) {
      const notifications = result.data.notifications;
      const unreadCount = notifications.filter(n => n.status === 'unread').length;

      // Update badge
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      // Update list
      if (list) {
        if (notifications.length === 0) {
          list.innerHTML = `<div class="p-4 text-center text-white/40 text-sm">${t('notifications.noNotifications')}</div>`;
          return;
        }

        list.innerHTML = notifications.map(n => `
          <div class="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${n.status === 'unread' ? 'bg-pong-primary/5' : ''}" data-type="${n.type}" data-status="${n.status}" data-id="${n.id}">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-pong-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                ${n.senderAvatar && n.senderAvatar !== '/default-avatar.png'
            ? `<img src="${n.senderAvatar}" alt="" class="w-full h-full object-cover" />`
            : `<img src="/default-avatar.png" alt="" class="w-full h-full object-cover" />`
          }
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white">
                  ${getNotificationText(n)}
                </p>
                <p class="text-[10px] text-white/40 mt-1">${formatRelativeTime(n.createdAt)}</p>
                
                ${n.type === 'friend_request' && n.status === 'unread' ? `
                  <div class="flex gap-2 mt-2">
                    <button class="btn btn-primary text-[10px] py-1 px-3 accept-friend-btn" data-notif-id="${n.id}" data-sender-id="${n.senderId}">
                      ${t('notifications.accept')}
                    </button>
                    <button class="btn btn-secondary text-[10px] py-1 px-3 decline-friend-btn" data-notif-id="${n.id}" data-sender-id="${n.senderId}">
                      ${t('notifications.decline')}
                    </button>
                  </div>
                ` : n.type === 'game_invite' && n.status === 'unread' ? `
                  <div class="flex gap-2 mt-2">
                    <button class="btn btn-primary text-[10px] py-1 px-3 accept-game-btn" data-notif-id="${n.id}" data-room-id="${encodeURIComponent(n.data || '')}">
                      ${t('notifications.accept')}
                    </button>
                    <button class="btn btn-secondary text-[10px] py-1 px-3 decline-game-btn" data-notif-id="${n.id}">
                      ${t('notifications.decline')}
                    </button>
                  </div>
                ` : `
                   <div class="mt-2 text-[10px]">
                     <a href="/profile/${n.senderId}" data-link class="text-pong-primary hover:underline">${t('notifications.viewProfile')}</a>
                   </div>
                `}
              </div>
            </div>
          </div>
        `).join('');

        // Add event listeners for accept/decline buttons
        list.querySelectorAll('.accept-friend-btn').forEach(btn => {
          (btn as HTMLElement).onclick = (e) => handleFriendAction(e, 'accept');
        });
        list.querySelectorAll('.decline-friend-btn').forEach(btn => {
          (btn as HTMLElement).onclick = (e) => handleFriendAction(e, 'reject');
        });
        list.querySelectorAll('.accept-game-btn').forEach(btn => {
          (btn as HTMLElement).onclick = (e) => handleGameInviteAction(e, 'accept');
        });
        list.querySelectorAll('.decline-game-btn').forEach(btn => {
          (btn as HTMLElement).onclick = (e) => handleGameInviteAction(e, 'reject');
        });
      }
    }
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  }
}

function getNotificationText(n: any): string {
  const name = n.senderName || 'Someone';
  switch (n.type) {
    case 'friend_request':
      return t('notifications.friendRequest').replace('{name}', `<strong>${name}</strong>`);
    case 'game_invite':
      return t('notifications.gameInvite').replace('{name}', `<strong>${name}</strong>`);
    case 'system':
      if (n.senderId) return t('notifications.accepted').replace('{name}', `<strong>${name}</strong>`);
      return n.data || 'System notification';
    default:
      return 'New notification';
  }
}

function formatRelativeTime(dateStr: string): string {
  // SQLite returns UTC timestamps without timezone info (e.g., "2024-01-20 12:00:00")
  // We need to explicitly treat it as UTC by appending 'Z' or converting to ISO format
  let date: Date;

  // If dateStr doesn't have timezone info, append 'Z' to treat it as UTC
  if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+')) {
    // Convert SQLite format to ISO: "2024-01-20 12:00:00" -> "2024-01-20T12:00:00Z"
    const isoDate = dateStr.replace(' ', 'T') + 'Z';
    date = new Date(isoDate);
  } else {
    date = new Date(dateStr);
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('time.justNow');
  if (diffInSeconds < 3600) return t('time.minutesAgo', { count: Math.floor(diffInSeconds / 60).toString() });
  if (diffInSeconds < 86400) return t('time.hoursAgo', { count: Math.floor(diffInSeconds / 3600).toString() });
  return t('time.daysAgo', { count: Math.floor(diffInSeconds / 86400).toString() });
}

async function handleFriendAction(e: Event, action: 'accept' | 'reject'): Promise<void> {
  const btn = e.currentTarget as HTMLButtonElement;
  const notifId = btn.getAttribute('data-notif-id');
  const senderId = btn.getAttribute('data-sender-id');
  const { api } = await import('../utils/api');
  const { auth } = await import('../utils/auth');

  const userId = auth.getUser()?.id;
  if (!userId || !senderId || !notifId) return;

  try {
    const friendResult = await api.put(`/users/${userId}/friends/${senderId}`, { action });
    if (friendResult.success) {
      await api.put(`/users/notifications/${notifId}/read`, {});
      fetchNotifications();
    } else {
      alert(friendResult.error || 'Failed to process request');
    }
  } catch (err) {
    console.error('Error handling friend action:', err);
  }
}

async function handleGameInviteAction(e: Event, action: 'accept' | 'reject'): Promise<void> {
  const btn = e.currentTarget as HTMLButtonElement;
  const notifId = btn.getAttribute('data-notif-id');
  const notifDataEncoded = btn.getAttribute('data-room-id'); // This contains URL-encoded JSON data
  const { api } = await import('../utils/api');
  const { router } = await import('../utils/router');

  if (!notifId) return;

  try {
    // 1. Mark notification as read
    await api.put(`/users/notifications/${notifId}/read`, {});

    if (action === 'accept' && notifDataEncoded) {
      // Decode the URL-encoded data first
      const notifData = decodeURIComponent(notifDataEncoded);

      // Parse notification data (can be JSON or plain roomId for backwards compatibility)
      let roomId: string;
      let inviterId: number | undefined;

      try {
        const parsed = JSON.parse(notifData);
        roomId = parsed.roomId;
        inviterId = parsed.inviterId;
      } catch {
        // Backwards compatibility: if it's not JSON, treat as plain roomId
        roomId = notifData;
      }

      // 2. Navigate to game with inviterId (the person who invited us)
      let url = `/game?mode=invite&roomId=${roomId}`;
      if (inviterId) {
        url += `&inviterId=${inviterId}`;
      }
      router.navigate(url);
    } else {
      // 3. Just refresh notifications
      fetchNotifications();
    }
  } catch (err) {
    console.error('Error handling game invite action:', err);
  }
}
