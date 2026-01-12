/**
 * Home Page
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';

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
        <p class="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
          ${t('home.subtitle')}
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/game" data-link class="btn btn-primary text-lg px-8 py-4 glow animate-pulse-slow">
            🎮 ${t('home.playNow')}
          </a>
          <a href="/tournament" data-link class="btn btn-secondary text-lg px-8 py-4">
            🏆 ${t('home.joinTournament')}
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
            <div class="text-5xl mb-4">👥</div>
            <h3 class="font-game text-xl text-pong-primary mb-3">${t('home.features.multiplayer')}</h3>
            <p class="text-gray-400">${t('home.features.multiplayerDesc')}</p>
          </div>

          <!-- Tournaments -->
          <div class="card-hover text-center">
            <div class="text-5xl mb-4">🏆</div>
            <h3 class="font-game text-xl text-pong-primary mb-3">${t('home.features.tournaments')}</h3>
            <p class="text-gray-400">${t('home.features.tournamentsDesc')}</p>
          </div>

          <!-- AI -->
          <div class="card-hover text-center">
            <div class="text-5xl mb-4">🤖</div>
            <h3 class="font-game text-xl text-pong-primary mb-3">${t('home.features.ai')}</h3>
            <p class="text-gray-400">${t('home.features.aiDesc')}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pong Preview Section -->
    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="game-container aspect-video flex items-center justify-center">
          <div class="text-center">
            <div class="font-game text-6xl text-pong-primary/30 mb-4">PONG</div>
            <p class="text-gray-500">${t('home.playNow')}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-white/10">
      <div class="max-w-6xl mx-auto px-4 text-center text-gray-500">
        <p>© 2024 ft_transcendence • 42 School Project</p>
      </div>
    </footer>
  `;
}
