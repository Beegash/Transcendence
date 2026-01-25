import { t } from '../../i18n';
import api from '../../utils/api';
import { gameSocket, GameState } from '../../utils/gameSocket';
import { router } from '../../utils/router';
import { CleanupManager } from './utils/cleanup';
import type { PlayerNumber } from './types';
import {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	PADDLE_HEIGHT,
	PADDLE_WIDTH,
	BALL_SIZE,
	PADDLE_SPEED,
	WINNING_SCORE
} from './constants';
import {
	drawBackground,
	drawCenterLine,
	drawPaddle,
	drawBall,
	drawScore,
	drawPauseMessage
} from './utils/renderer';
import { showGameOverOverlay, updateGameOverOverlay } from './utils/gameOverOverlay';

export function startOnlineTournament(
	content: HTMLElement,
	tournamentId: number,
	matchId: number,
	cleanupManager: CleanupManager,
	setPlayerNumber: (num: PlayerNumber) => void,
	setCurrentRoomId: (id: string | null) => void,
	showWaitingRoom: (roomId: string) => void,
	showReadyScreen: (opponentName?: string) => void
): void {
	content.innerHTML = `
		<div class="max-w-lg mx-auto px-4 py-8 text-center">
			<h2 class="font-game text-2xl text-yellow-500 mb-8">${t('game.tournamentMatch')}</h2>
			<div id="connection-status" class="text-center text-white/60 text-sm mb-4">${t('game.joiningMatch')}</div>
			<div id="tournament-lobby-error" class="hidden bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm mb-4"></div>
			
			<div class="card p-6">
				<p class="text-white/80 mb-2">${t('game.matchId')}:</p>
				<p class="font-game text-2xl text-gradient">${matchId}</p>
			</div>
		</div>
	`;

	const statusDiv = document.getElementById('connection-status')!;
	const errorDiv = document.getElementById('tournament-lobby-error')!;

	gameSocket.connect().then(() => {
		statusDiv.textContent = t('game.connectedJoiningMatch');
		// Send custom message to join tournament match
		gameSocket.send({ type: 'join_tournament_match', roomId: matchId.toString() });
	}).catch(() => {
		statusDiv.textContent = t('game.connectionFailed');
		statusDiv.classList.add('text-red-400');
	});

	const unsubRoomCreated = gameSocket.on('room_created', (data) => {
		setPlayerNumber(data.player || 1);
		setCurrentRoomId(data.roomId || null);
		showWaitingRoom(data.roomId!);
	});

	const unsubRoomJoined = gameSocket.on('room_joined', (data) => {
		setPlayerNumber(data.player || 2);
		setCurrentRoomId(data.roomId || null);
		showReadyScreen((data as any).hostUsername || 'Opponent');
	});

	const unsubError = gameSocket.on('error', (data) => {
		errorDiv.textContent = data.message || 'An error occurred';
		errorDiv.classList.remove('hidden');
	});

	cleanupManager.add(unsubRoomCreated);
	cleanupManager.add(unsubRoomJoined);
	cleanupManager.add(unsubError);
}

export function startOnlineTournamentGame(
	content: HTMLElement,
	initialState: GameState,
	tournamentId: number,
	matchId: number,
	playerNumber: PlayerNumber,
	cleanupManager: CleanupManager
): void {
	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-game text-xl text-yellow-500">Tournament Match</h2>
        <span class="badge badge-online">Match ID: ${matchId}</span>
      </div>
      
      <div class="card p-2 relative">
        <canvas id="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" class="w-full bg-pong-darker rounded-lg"></canvas>
        <div id="saving-overlay" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center hidden rounded-lg">
            <div class="loading-spinner mb-4"></div>
            <p class="text-white font-game">Saving Result...</p>
        </div>
      </div>
      
      <div class="flex justify-between items-center mt-6">
          <div class="font-game text-xl"><span class="${playerNumber === 1 ? 'text-red-400' : 'text-blue-400'}">${t('game.you')}</span>: ${t('game.player')} ${playerNumber} (${playerNumber === 1 ? t('game.red') : t('game.blue')})</div>
          <div class="text-white/60">${t('game.firstToWins', { score: WINNING_SCORE.toString() })}</div>
          <div class="text-pong-secondary font-game text-xl">${t('game.opponent')}</div>
      </div>
      
      <p class="text-center text-white/60 text-sm mt-4">
        ${t('game.useArrows')}
      </p>
    </div>
  `;

	const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
	if (!canvas) return;
	const ctx = canvas.getContext('2d')!;
	const savingOverlay = document.getElementById('saving-overlay');

	let gameState: GameState = initialState;
	let myPaddleY = playerNumber === 1 ? gameState.paddles.player1 : gameState.paddles.player2;
	let resultSaved = false;
	let animationFrameId: number | null = null;
	const keys: Record<string, boolean> = {};

	const keyDownHandler = (e: KeyboardEvent) => {
		keys[e.key.toLowerCase()] = true;
		// Resume ball when space is pressed and ball is paused
		if (e.key === ' ' && gameState.ballPaused) {
			gameSocket.resumeBall();
		}
		if (gameState.status === 'finished' && (e.key === ' ' || e.key === 'Enter')) {
			navigateToTournament();
		}
	};
	const keyUpHandler = (e: KeyboardEvent) => keys[e.key.toLowerCase()] = false;

	canvas.addEventListener('click', () => {
		// Resume ball on click if paused
		if (gameState.ballPaused) {
			gameSocket.resumeBall();
		}
		if (gameState.status === 'finished') {
			navigateToTournament();
		}
	});

	window.addEventListener('keydown', keyDownHandler);
	window.addEventListener('keyup', keyUpHandler);
	cleanupManager.add(() => {
		window.removeEventListener('keydown', keyDownHandler);
		window.removeEventListener('keyup', keyUpHandler);
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
	});

	function navigateToTournament() {
		router.navigate(`/tournament/${tournamentId}`);
	}

	const unsubState = gameSocket.on('game_state', (data) => {
		if (data.state) gameState = data.state;
	});

	const unsubGameOver = gameSocket.on('game_over', async (data) => {
		gameState.status = 'finished';
		gameState.winner = data.winner;
		if (data.state) gameState.score = data.state.score;

		// Ensure winner is defined
		if (!data.winner) {
			console.error('Game over without winner');
			return;
		}

		const isForfeit = data.reason === 'opponent_disconnected';

		// Show saving overlay first
		if (savingOverlay) {
			const overlay = showGameOverOverlay({
				playerNumber,
				winner: data.winner,
				showSavingSpinner: !isForfeit,
				customMessage: isForfeit ? t('game.opponentDisconnected') : undefined
			});
			savingOverlay.innerHTML = '';
			savingOverlay.appendChild(overlay);
			savingOverlay.classList.remove('hidden');
		}

		// Only save result if not a forfeit (forfeit results are saved by backend)
		if (!isForfeit) {
			try {
				const score1 = data.state?.score?.player1 ?? gameState.score.player1;
				const score2 = data.state?.score?.player2 ?? gameState.score.player2;

				await api.post(`/tournaments/${tournamentId}/match/${matchId}/result`, {
					player1Score: score1,
					player2Score: score2
				});

				// Update overlay after save
				const overlayElement = savingOverlay?.querySelector('#game-over-overlay');
				if (overlayElement) {
					updateGameOverOverlay(
						overlayElement as HTMLElement,
						playerNumber,
						data.winner
					);
				}
				resultSaved = true;
			} catch (err) {
				console.error('Error saving result:', err);
				// Still show success message
				const overlayElement = savingOverlay?.querySelector('#game-over-overlay');
				if (overlayElement) {
					updateGameOverOverlay(
						overlayElement as HTMLElement,
						playerNumber,
						data.winner,
						t('game.errorSavingResult')
					);
				}
			}
		} else {
			// Forfeit - already showing the right message
			resultSaved = true;
		}
	});

	cleanupManager.add(unsubState);
	cleanupManager.add(unsubGameOver);

	function update(): void {
		if (gameState.status !== 'playing') return;

		let moved = false;
		if (keys['w'] || keys['arrowup']) {
			myPaddleY = Math.max(0, myPaddleY - PADDLE_SPEED);
			moved = true;
		}
		if (keys['s'] || keys['arrowdown']) {
			myPaddleY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, myPaddleY + PADDLE_SPEED);
			moved = true;
		}

		if (moved) gameSocket.movePaddle(myPaddleY);
	}

	function render(): void {
		const isP2 = playerNumber === 2;
		const flipX = (x: number, width: number) => isP2 ? CANVAS_WIDTH - x - width : x;

		drawBackground(ctx);
		drawCenterLine(ctx);

		// Paddles - Red (P1) and Blue (P2)
		const p1X = flipX(0, PADDLE_WIDTH);
		const p2X = flipX(CANVAS_WIDTH - PADDLE_WIDTH, PADDLE_WIDTH);

		drawPaddle(ctx, p1X, gameState.paddles.player1, '#C0392B');
		drawPaddle(ctx, p2X, gameState.paddles.player2, '#3498DB');

		// Ball
		const ballX = flipX(gameState.ball.x, BALL_SIZE);
		drawBall(ctx, ballX, gameState.ball.y);

		// Score
		const p1ScoreX = isP2 ? (CANVAS_WIDTH / 4) * 3 : CANVAS_WIDTH / 4;
		const p2ScoreX = isP2 ? CANVAS_WIDTH / 4 : (CANVAS_WIDTH / 4) * 3;

		ctx.font = '48px Orbitron, monospace';
		ctx.fillStyle = '#C0392B';
		ctx.textAlign = 'center';
		ctx.fillText(gameState.score.player1.toString(), p1ScoreX, 60);
		ctx.fillStyle = '#3498DB';
		ctx.fillText(gameState.score.player2.toString(), p2ScoreX, 60);

		// Pause message only (winner is shown in overlay)
		if (gameState.ballPaused && gameState.status !== 'finished') {
			drawPauseMessage(ctx, t('game.pressSpace'));
		}
	}

	function gameLoop(): void {
		update();
		render();
		animationFrameId = requestAnimationFrame(gameLoop);
	}

	gameLoop();
}
