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
    <nav class="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-24">
          <!-- Logo -->
          <a href="/" data-link class="flex items-center space-x-4">
            <img src="/logo.png" alt="Transcendencer Supreme" class="h-20 w-auto animate-float" />
            <span class="font-game text-xl font-bold text-pong-primary glow-text tracking-wider">TRANSCENDER★★★SUPREME</span>
          </a>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a href="/" data-link class="nav-link ${currentPath === '/' ? 'nav-link-active' : ''}">${t('nav.home')}</a>
            <a href="/game" data-link class="nav-link ${currentPath === '/game' ? 'nav-link-active' : ''}">${t('nav.play')}</a>
            <a href="/tournament" data-link class="nav-link ${currentPath === '/tournament' ? 'nav-link-active' : ''}">${t('nav.tournament')}</a>
            <a href="/dashboard" data-link class="nav-link ${currentPath === '/dashboard' ? 'nav-link-active' : ''}">${t('nav.dashboard') || 'Dashboard'}</a>
            ${isLoggedIn ? `<a href="/profile" data-link class="nav-link ${currentPath === '/profile' ? 'nav-link-active' : ''}">${t('nav.profile')}</a>` : ''}
          </div>

          <!-- Right side: Language & Auth -->
          <div class="flex items-center space-x-4">
            <!-- Language Selector -->
            <div class="relative">
              <select id="language-selector" class="bg-transparent border border-pong-light rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-pong-primary cursor-pointer">
                ${i18n.getAvailableLanguages().map(lang => `
                  <option value="${lang.code}" ${i18n.getLanguage() === lang.code ? 'selected' : ''} class="bg-pong-dark">
                    ${lang.name}
                  </option>
                `).join('')}
              </select>
            </div>

            ${isLoggedIn ? `
              <!-- User Menu (shown when logged in) -->
              <div class="flex items-center space-x-3">
                <a href="/settings" data-link class="text-gray-400 hover:text-white">
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
                    <span class="hidden sm:block text-sm text-gray-300">${user?.displayName || user?.username || 'User'}</span>
                  </button>
                  <!-- Dropdown -->
                  <div class="absolute right-0 top-full mt-2 w-48 bg-pong-dark border border-pong-light rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <a href="/profile" data-link class="block px-4 py-2 text-gray-300 hover:bg-pong-light/50 rounded-t-lg">${t('nav.profile')}</a>
                    <a href="/settings" data-link class="block px-4 py-2 text-gray-300 hover:bg-pong-light/50">${t('nav.settings')}</a>
                    <button id="logout-btn" class="w-full text-left px-4 py-2 text-red-400 hover:bg-pong-light/50 rounded-b-lg">${t('nav.logout')}</button>
                  </div>
                </div>
              </div>
            ` : `
              <!-- Auth Buttons (shown when not logged in) -->
              <div class="flex items-center space-x-2">
                <a href="/login" data-link class="btn btn-secondary text-sm py-2">${t('auth.login')}</a>
                <a href="/register" data-link class="btn btn-primary text-sm py-2">${t('auth.register')}</a>
              </div>
            `}

            <!-- Mobile Menu Button -->
            <button id="mobile-menu-btn" class="md:hidden text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-white/10">
        <div class="px-4 py-4 space-y-3">
          <a href="/" data-link class="block nav-link">${t('nav.home')}</a>
          <a href="/game" data-link class="block nav-link">${t('nav.play')}</a>
          <a href="/tournament" data-link class="block nav-link">${t('nav.tournament')}</a>
          <a href="/dashboard" data-link class="block nav-link">${t('nav.dashboard') || 'Dashboard'}</a>
          ${isLoggedIn ? `
            <a href="/profile" data-link class="block nav-link">${t('nav.profile')}</a>
            <a href="/settings" data-link class="block nav-link">${t('nav.settings')}</a>
            <button id="mobile-logout-btn" class="block w-full text-left nav-link text-red-400">${t('nav.logout')}</button>
          ` : `
            <a href="/login" data-link class="block nav-link">${t('auth.login')}</a>
            <a href="/register" data-link class="block nav-link">${t('auth.register')}</a>
          `}
        </div>
      </div>
    </nav>
    <div class="h-24"></div> <!-- Spacer for fixed navbar -->
  `;

  // Language selector event
  const langSelector = document.getElementById('language-selector') as HTMLSelectElement;
  langSelector?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;

    // Check if user is in a game
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const isInGame = currentPath === '/game' && (urlParams.has('mode') || urlParams.has('matchId'));

    if (isInGame) {
      // Show warning and revert selection
      alert(t('game.langChangeWarning'));
      target.value = i18n.getLanguage();
      return;
    }

    i18n.setLanguage(target.value as Language);
    renderNavbar();
  });

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });

  // Logout buttons
  const logoutBtn = document.getElementById('logout-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

  const handleLogout = async () => {
    await auth.logout();
    renderNavbar();
  };

  logoutBtn?.addEventListener('click', handleLogout);
  mobileLogoutBtn?.addEventListener('click', handleLogout);
}
