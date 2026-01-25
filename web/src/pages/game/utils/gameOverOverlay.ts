import { t } from '../../../i18n';
import type { PlayerNumber } from '../types';

export interface GameOverConfig {
	playerNumber: PlayerNumber;
	winner: 1 | 2;
	isLocalMode?: boolean;
	onRestart?: () => void;
	onExit?: () => void;
	showSavingSpinner?: boolean;
	customMessage?: string;
}

/**
 * Shows a unified game over overlay
 * Player's paddle color is used for text (red for P1, blue for P2)
 */
export function showGameOverOverlay(config: GameOverConfig): HTMLDivElement {
	const overlay = document.createElement('div');
	overlay.id = 'game-over-overlay';
	overlay.className = 'absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg';

	const isWinner = config.winner === config.playerNumber;
	const resultText = isWinner ? t('game.youWin') : t('game.youLose');

	// Use player's paddle color: P1 = red, P2 = blue
	const playerColor = config.playerNumber === 1 ? 'text-red-400' : 'text-blue-400';
	const playerColorHex = config.playerNumber === 1 ? '#C0392B' : '#3498DB';

	let content = '';

	if (config.showSavingSpinner) {
		content = `
			<div class="loading-spinner mb-4"></div>
			<p class="text-white font-game">${t('game.savingResult')}</p>
		`;
	} else {
		content = `
			<div class="text-5xl font-game ${playerColor} mb-6 animate-pulse">
				${resultText}
			</div>
		`;

		if (config.customMessage) {
			content += `
				<div class="text-white/80 mb-4">${config.customMessage}</div>
			`;
		}

		// Local mode: show restart option
		if (config.isLocalMode && config.onRestart) {
			content += `
				<button id="restart-btn" class="btn btn-primary mb-3">
					${t('game.playAgain')}
				</button>
				<button id="exit-btn" class="btn btn-secondary">
					${t('common.back')}
				</button>
			`;
		} else {
			// Other modes: show return to menu instruction
			content += `
				<div class="text-white/60 text-sm mt-4">
					${t('game.pressSpaceToMenu')}
				</div>
			`;
		}
	}

	overlay.innerHTML = content;

	// Add event listeners for local mode
	if (config.isLocalMode) {
		setTimeout(() => {
			overlay.querySelector('#restart-btn')?.addEventListener('click', () => {
				if (config.onRestart) config.onRestart();
			});
			overlay.querySelector('#exit-btn')?.addEventListener('click', () => {
				if (config.onExit) config.onExit();
			});
		}, 0);
	}

	return overlay;
}

/**
 * Updates existing overlay (e.g., after API save completes)
 */
export function updateGameOverOverlay(
	overlay: HTMLElement,
	playerNumber: PlayerNumber,
	winner: 1 | 2,
	message?: string
): void {
	const isWinner = winner === playerNumber;
	const resultText = isWinner ? t('game.youWin') : t('game.youLose');
	const playerColor = playerNumber === 1 ? 'text-red-400' : 'text-blue-400';

	overlay.innerHTML = `
		<div class="text-5xl font-game ${playerColor} mb-6 animate-pulse">
			${resultText}
		</div>
		${message ? `<div class="text-white/80 mb-4">${message}</div>` : ''}
		<div class="text-white/60 text-sm mt-4">
			${t('game.pressSpaceToMenu')}
		</div>
	`;
}
