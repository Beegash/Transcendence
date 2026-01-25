import { t } from '../../i18n';

export function renderGameMenu(
  content: HTMLElement,
  onLocalPlay: () => void,
  onAIPlay: () => void,
  onOnlinePlay: () => void
): void {
  content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="font-game text-4xl text-center text-gradient mb-8">${t('game.title')}</h1>
      
      <div class="grid md:grid-cols-3 gap-6">
        <!-- Local Play -->
        <div class="card hover:border-pong-primary transition-colors cursor-pointer" id="local-play-card">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pong-primary/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-pong-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="font-game text-xl text-pong-primary mb-2">${t('game.localPlay')}</h2>
            <p class="text-white/80 text-sm">
              ${t('game.localPlayDesc')}
            </p>
            <div class="mt-4 text-white/60 text-xs">
              ${t('game.controls')}
            </div>
          </div>
        </div>
        
        <!-- AI Play -->
        <div class="card hover:border-yellow-500 transition-colors cursor-pointer" id="ai-play-card">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h2 class="font-game text-xl text-yellow-500 mb-2">${t('game.aiPlay')}</h2>
            <p class="text-white/80 text-sm">
              ${t('game.aiPlayDesc')}
            </p>
            <div class="mt-4 text-white/60 text-xs">
              ${t('game.aiRefreshInfo')}
            </div>
          </div>
        </div>
        
        <!-- Online Play -->
        <div class="card hover:border-pong-secondary transition-colors cursor-pointer" id="online-play-card">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pong-secondary/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-pong-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
            </div>
            <h2 class="font-game text-xl text-pong-secondary mb-2">${t('game.onlinePlay')}</h2>
            <p class="text-white/80 text-sm">
              ${t('game.onlinePlayDesc')}
            </p>
            <div class="mt-4 text-white/60 text-xs">
              ${t('game.realTimeMultiplayer')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('local-play-card')?.addEventListener('click', onLocalPlay);
  document.getElementById('ai-play-card')?.addEventListener('click', onAIPlay);
  document.getElementById('online-play-card')?.addEventListener('click', onOnlinePlay);
}
