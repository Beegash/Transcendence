import { t } from '../../i18n';
import { gameSocket, GameState } from '../../utils/gameSocket';
import { CleanupManager } from './utils/cleanup';
import { showGameOverOverlay } from './utils/gameOverOverlay';
import type { PlayerNumber } from './types';

export function startAIGame(
	content: HTMLElement,
	cleanupManager: CleanupManager,
	onCancel: () => void,
	setPlayerNumber: (num: PlayerNumber) => void,
	setCurrentRoomId: (id: string | null) => void
): void {
	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-yellow-500 mb-8">${t('game.vsAI')}</h2>
      
      <div class="card mb-6">
        <p class="text-white/80 mb-4">${t('game.connectingServer')}</p>
        <div class="loading-spinner mx-auto"></div>
      </div>
      
      <button id="cancel-btn" class="btn btn-secondary">${t('common.cancel')}</button>
    </div>
  `;

	document.getElementById('cancel-btn')?.addEventListener('click', onCancel);

	// Connect and create AI room
	gameSocket.connect().then(() => {
		gameSocket.createAIRoom();
	}).catch(() => {
		content.innerHTML = `
      <div class="max-w-lg mx-auto px-4 py-8 text-center">
        <h2 class="font-game text-2xl text-red-500 mb-4">${t('game.connectionFailed')}</h2>
        <p class="text-white/80 mb-6">${t('game.couldNotConnect')}</p>
        <button id="back-btn" class="btn btn-secondary">${t('game.backToMenu')}</button>
      </div>
    `;
		document.getElementById('back-btn')?.addEventListener('click', onCancel);
	});

	// Handle AI room created
	const unsubAIRoom = gameSocket.on('ai_room_created', (data) => {
		setPlayerNumber(1);
		setCurrentRoomId(data.roomId || null);
		showAIReadyScreen(content, cleanupManager);
	});

	cleanupManager.add(unsubAIRoom);
}

export function showAIReadyScreen(
	content: HTMLElement,
	cleanupManager: CleanupManager,
	onGameStart?: (state: GameState) => void
): void {
	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-yellow-500 mb-8">${t('game.aiReady')}</h2>
      
      <div class="card mb-6">
        <p class="text-white/80 mb-2">${t('game.playingAgainst')}</p>
        <p class="font-game text-2xl text-yellow-500">${t('game.aiOpponent')}</p>
        <p class="text-white/60 text-sm mt-2">${t('game.aiRefreshInfo')}</p>
      </div>
      
      <p class="text-white/70 mb-6">${t('game.clickReadyToStart')}</p>
      
      <button id="ready-btn" class="btn btn-primary btn-lg">${t('game.imReady')}</button>
      
      <p class="text-white/50 text-sm mt-6">${t('game.you')}: ${t('game.player')} 1 (${t('game.red')})</p>
    </div>
  `;

	document.getElementById('ready-btn')?.addEventListener('click', () => {
		gameSocket.ready();
		const btn = document.getElementById('ready-btn')!;
		btn.textContent = t('game.startingGame');
		btn.classList.add('opacity-50');
		(btn as HTMLButtonElement).disabled = true;
	});

	const unsubGameStart = gameSocket.on('game_start', (data) => {
		if (data.state && onGameStart) {
			onGameStart(data.state);
		}
	});

	cleanupManager.add(unsubGameStart);
}
