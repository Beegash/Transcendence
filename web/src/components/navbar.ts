/**
 * Navbar Component
 */

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
              <img src="/logo.png" alt="Transcendencer Supreme" class="h-10 md:h-20 w-auto animate-float" />
              <span class="md:hidden font-game text-xs text-pong-primary">TRANSCENDER★★★SUPREME</span>
              <span class="hidden md:inline font-game text-xl font-bold text-pong-primary glow-text tracking-wider">TRANSCENDER★★★SUPREME</span>
            </a>
          </div>

          <!-- Desktop Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a href="/" data-link class="nav-link ${currentPath === '/' ? 'nav-link-active' : ''}">${t('nav.home')}</a>
            <a href="/game" data-link class="nav-link ${currentPath === '/game' ? 'nav-link-active' : ''}">${t('nav.play')}</a>
            <a href="/tournament" data-link class="nav-link ${currentPath === '/tournament' ? 'nav-link-active' : ''}">${t('nav.tournament')}</a>
            <a href="/dashboard" data-link class="nav-link ${currentPath === '/dashboard' ? 'nav-link-active' : ''}">${t('nav.dashboard')}</a>
            ${isLoggedIn ? `<a href="/profile" data-link class="nav-link ${currentPath === '/profile' ? 'nav-link-active' : ''}">${t('nav.profile')}</a>` : ''}
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
                <div class="relative group">
                  <button class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div class="w-8 h-8 rounded-full bg-pong-primary/20 flex items-center justify-center border-2 border-pong-primary overflow-hidden">
                      ${user?.avatarUrl && user.avatarUrl !== '/default-avatar.png'
        ? `<img src="${user.avatarUrl}" alt="${user.displayName}" class="w-full h-full object-cover" />`
        : `<span class="text-pong-primary font-semibold text-sm">${user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>`
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
        : `<span class="text-pong-primary font-semibold text-sm">${user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>`
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

  langSelector?.addEventListener('change', handleLangChange);
  mobileLangSelector?.addEventListener('change', handleLangChange);

  // Logout buttons
  const logoutBtn = document.getElementById('logout-btn');
  const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');

  const handleLogout = async () => {
    closeSidebar();
    await auth.logout();
    renderNavbar();
  };

  logoutBtn?.addEventListener('click', handleLogout);
  sidebarLogoutBtn?.addEventListener('click', handleLogout);
}

