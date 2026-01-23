/**
 * Home Page
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import { getGdprPopupHtml, showGdprPopup, initGdprPopup } from '../components/gdpr-popup';

export function renderHomePage(): void {
  renderNavbar();

  const app = document.getElementById('app');
  if (!app) return;

  // Get or create content container
  let content = document.getElementById('page-content');
  if (!content) {
    content = document.createElement('div');
    content.id = 'page-content';
    app.appendChild(content);
  }

  content.innerHTML = `
    <!-- Hero Section -->
    <section class="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 bg-gradient-to-b from-pong-primary/5 to-transparent"></div>
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-pong-primary/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pong-secondary/10 rounded-full blur-3xl"></div>
      
      <div class="relative z-10 text-center px-4">
        <h1 class="font-game text-5xl md:text-7xl font-bold mb-6">
          <span class="text-gradient glow-text">${t('home.title')}</span>
        </h1>
        <p class="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
          ${t('home.subtitle')}
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/game" data-link class="btn btn-primary text-lg px-8 py-4 glow animate-pulse-slow">
            ${t('home.playNow')}
          </a>
          <a href="/tournament" data-link class="btn btn-secondary text-lg px-8 py-4">
            ${t('home.joinTournament')}
          </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Multiplayer -->
          <div class="card-hover text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pong-primary/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-pong-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="font-game text-xl text-pong-primary mb-3">${t('home.features.multiplayer')}</h3>
            <p class="text-white/80">${t('home.features.multiplayerDesc')}</p>
          </div>

          <!-- Tournaments -->
          <div class="card-hover text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <h3 class="font-game text-xl text-pong-primary mb-3">${t('home.features.tournaments')}</h3>
            <p class="text-white/80">${t('home.features.tournamentsDesc')}</p>
          </div>

          <!-- AI -->
          <div class="card-hover text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="font-game text-xl text-pong-primary mb-3">${t('home.features.ai')}</h3>
            <p class="text-white/80">${t('home.features.aiDesc')}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pong Preview Section -->
    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto">
        <a href="/game" data-link class="block group cursor-pointer">
          <div class="pong-table aspect-video flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] rounded-lg">
            <div class="text-center relative z-10 p-8 bg-black/20 backdrop-blur-sm rounded-xl border border-white/20">
              <div class="font-game text-6xl text-white mb-4 drop-shadow-md">PONG</div>
              <p class="text-white/80 text-xl font-medium tracking-wide">${t('home.playNow')}</p>
            </div>
          </div>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-white/10">
      <div class="max-w-6xl mx-auto px-4 text-center text-white/60">
        <p>© ${new Date().getFullYear()} ft_transcendence • 42 School Project • <button id="home-gdpr-link" class="text-pong-primary hover:underline cursor-pointer">GDPR</button></p>
      </div>
    </footer>

    ${getGdprPopupHtml()}
  `;

  // Initialize GDPR popup
  initGdprPopup();

  // GDPR link click handler
  const gdprLink = document.getElementById('home-gdpr-link');
  gdprLink?.addEventListener('click', showGdprPopup);
}
