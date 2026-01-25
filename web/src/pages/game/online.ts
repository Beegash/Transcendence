import { t } from '../../i18n';
import { gameSocket, GameState } from '../../utils/gameSocket';
import { CleanupManager } from './utils/cleanup';
import type { PlayerNumber } from './types';
import {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	PADDLE_HEIGHT,
	PADDLE_WIDTH,
	BALL_SIZE,
	PADDLE_SPEED
} from './constants';
import {
	drawBackground,
	drawCenterLine,
	drawPaddle,
	drawBall,
	drawScore,
	drawEndGameMessage,
	drawPauseMessage
} from './utils/renderer';
import { showGameOverOverlay } from './utils/gameOverOverlay';

export function showOnlineLobby(
	content: HTMLElement,
	cleanupManager: CleanupManager,
	onBack: () => void,
	setPlayerNumber: (num: PlayerNumber) => void,
	setCurrentRoomId: (id: string | null) => void,
	showWaitingRoom: (roomId: string) => void,
	showReadyScreen: (opponentName?: string) => void
): void {
	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <button id="back-btn" class="btn btn-secondary text-sm">← ${t('common.back')}</button>
        <h2 class="font-game text-xl text-pong-secondary">${t('game.onlinePlay')}</h2>
        <div class="w-20"></div>
      </div>
      
      <div class="space-y-6">
        <!-- Create Room -->
        <div class="card">
          <h3 class="font-game text-lg text-pong-primary mb-4">${t('game.createRoom')}</h3>
          <p class="text-white/80 text-sm mb-4">${t('game.createRoomDesc')}</p>
          <button id="create-room-btn" class="btn btn-primary w-full">${t('game.createRoom')}</button>
        </div>
        
        <!-- Join Room -->
        <div class="card">
          <h3 class="font-game text-lg text-pong-secondary mb-4">${t('game.joinRoom')}</h3>
          <p class="text-white/80 text-sm mb-4">${t('game.joinRoomDesc')}</p>
          <div class="flex gap-2">
            <input type="text" id="room-code-input" class="input flex-1 uppercase" placeholder="${t('game.roomCode')}" maxlength="6">
            <button id="join-room-btn" class="btn btn-secondary">${t('game.join')}</button>
          </div>
        </div>
        
        <!-- Available Rooms -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-game text-lg text-purple-400">${t('game.availableRooms')}</h3>
            <button id="refresh-rooms-btn" class="text-white/60 hover:text-white text-sm">↻ ${t('game.refresh')}</button>
          </div>
          <div id="rooms-list" class="space-y-2">
            <div class="text-center text-white/60 text-sm py-4">${t('game.loadingRooms')}</div>
          </div>
        </div>
        
        <div id="connection-status" class="text-center text-white/60 text-sm"></div>
        <div id="lobby-error" class="hidden bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm"></div>
      </div>
    </div>
  `;

	const statusDiv = document.getElementById('connection-status')!;
	const errorDiv = document.getElementById('lobby-error')!;
	const roomsList = document.getElementById('rooms-list')!;

	// Fetch available rooms
	async function loadRooms() {
		try {
			const response = await fetch('/api/game/rooms');
			const data = await response.json();
			const rooms = data.rooms || [];

			// Filter only waiting rooms (not AI, not playing)
			const waitingRooms = rooms.filter((r: { status: string; isVsAI: boolean }) =>
				r.status === 'waiting' && !r.isVsAI
			);

			if (waitingRooms.length === 0) {
				roomsList.innerHTML = `<div class="text-center text-white/60 text-sm py-4">${t('game.noRooms')}</div>`;
			} else {
				roomsList.innerHTML = waitingRooms.map((room: { id: string; players: number }) => `
					<div class="flex items-center justify-between bg-pong-darker p-3 rounded-lg">
						<div>
							<span class="font-game text-pong-primary">${room.id}</span>
							<span class="text-white/60 text-xs ml-2">(${room.players}/2 players)</span>
						</div>
						<button class="btn btn-sm btn-primary join-room-quick" data-room="${room.id}">Join</button>
					</div>
				`).join('');

				// Add click handlers for quick join
				roomsList.querySelectorAll('.join-room-quick').forEach(btn => {
					btn.addEventListener('click', () => {
						const roomId = (btn as HTMLElement).dataset.room;
						if (roomId) gameSocket.joinRoom(roomId);
					});
				});
			}
		} catch {
			roomsList.innerHTML = `<div class="text-center text-red-400 text-sm py-4">${t('game.failedLoadRooms')}</div>`;
		}
	}

	// Initial load and periodic refresh
	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	document.getElementById('back-btn')?.addEventListener('click', () => {
		if (refreshInterval) clearInterval(refreshInterval);
		onBack();
	});

	document.getElementById('refresh-rooms-btn')?.addEventListener('click', loadRooms);

	// Connect to WebSocket
	statusDiv.textContent = t('game.connecting');
	gameSocket.connect().then(() => {
		statusDiv.textContent = t('game.connected');
		statusDiv.classList.add('text-green-400');
		loadRooms();
		refreshInterval = setInterval(loadRooms, 5000); // Refresh every 5 seconds
	}).catch(() => {
		statusDiv.textContent = t('game.connectionFailed');
		statusDiv.classList.add('text-red-400');
	});

	// Cleanup on page change
	cleanupManager.add(() => {
		if (refreshInterval) clearInterval(refreshInterval);
	});

	// Create room
	document.getElementById('create-room-btn')?.addEventListener('click', () => {
		gameSocket.createRoom();
	});

	// Join room
	document.getElementById('join-room-btn')?.addEventListener('click', () => {
		const input = document.getElementById('room-code-input') as HTMLInputElement;
		const code = input.value.trim().toUpperCase();
		if (code.length !== 6) {
			errorDiv.textContent = t('game.roomCodeError');
			errorDiv.classList.remove('hidden');
			return;
		}
		errorDiv.classList.add('hidden');
		gameSocket.joinRoom(code);
	});

	// Handle WebSocket events
	const unsubRoomCreated = gameSocket.on('room_created', (data) => {
		setPlayerNumber(data.player || 1);
		setCurrentRoomId(data.roomId || null);
		if (refreshInterval) clearInterval(refreshInterval);
		showWaitingRoom(data.roomId!);
	});

	const unsubRoomJoined = gameSocket.on('room_joined', (data) => {
		setPlayerNumber(data.player || 2);
		setCurrentRoomId(data.roomId || null);
		if (refreshInterval) clearInterval(refreshInterval);
		// Player 2 goes directly to Ready screen (opponent already exists)
		showReadyScreen((data as { hostUsername?: string }).hostUsername || 'Opponent');
	});

	const unsubError = gameSocket.on('error', (data) => {
		errorDiv.textContent = data.message || 'An error occurred';
		errorDiv.classList.remove('hidden');
	});

	cleanupManager.add(unsubRoomCreated);
	cleanupManager.add(unsubRoomJoined);
	cleanupManager.add(unsubError);
}

export function showWaitingRoom(
	content: HTMLElement,
	roomId: string,
	playerNumber: PlayerNumber,
	cleanupManager: CleanupManager,
	onCancel: () => void,
	showReadyScreen: (opponentName?: string) => void,
	showOnlineLobby: () => void
): void {
	console.log('[Game] Showing waiting room for:', roomId);

	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-pong-primary mb-8">${t('game.waitingForOpponent')}</h2>
      
      <div class="card mb-6">
        <p class="text-white/80 mb-2">${t('game.roomCodeLabel')}</p>
        <p class="font-game text-4xl text-gradient tracking-widest" id="room-id">${roomId}</p>
        <button id="copy-code-btn" class="btn btn-secondary text-sm mt-4">${t('game.copyCode')}</button>
      </div>
      
      <div class="flex items-center justify-center gap-2 text-white/60">
        <div class="loading-spinner"></div>
        <span>${t('game.waitingPlayer2')}</span>
      </div>
      
      <p class="text-white/50 text-sm mt-6">${t('game.youArePlayer')} ${playerNumber}</p>
      
      <button id="cancel-btn" class="btn btn-secondary mt-8">${t('common.cancel')}</button>
    </div>
  `;

	document.getElementById('copy-code-btn')?.addEventListener('click', () => {
		navigator.clipboard.writeText(roomId);
		const btn = document.getElementById('copy-code-btn')!;
		btn.textContent = t('game.copied');
		setTimeout(() => btn.textContent = t('game.copyCode'), 2000);
	});

	document.getElementById('cancel-btn')?.addEventListener('click', onCancel);

	// Listen for opponent joining
	const unsubOpponentJoined = gameSocket.on('opponent_joined', (data) => {
		// Unsubscribe disconnect listener when opponent joins
		// From this point on, game will handle disconnects
		unsubDisconnect();
		showReadyScreen(data.username);
	});

	// Handle host disconnecting (fallback, shouldn't happen here but just in case)
	const unsubDisconnect = gameSocket.on('opponent_disconnected', () => {
		alert(t('game.roomClosed'));
		showOnlineLobby();
	});

	cleanupManager.add(unsubOpponentJoined);
	cleanupManager.add(unsubDisconnect);
}

export function showReadyScreen(
	content: HTMLElement,
	playerNumber: PlayerNumber,
	cleanupManager: CleanupManager,
	onGameStart: (state: GameState) => void,
	showOnlineLobby: () => void,
	opponentName?: string
): void {
	console.log('[Game] Showing ready screen, opponent:', opponentName);

	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-pong-primary mb-8">${t('game.opponentJoined')}</h2>
      
      <div class="card mb-6">
        <p class="text-white/80 mb-2">${t('game.playingAgainst')}</p>
        <p class="font-game text-2xl text-pong-secondary">${opponentName || t('common.anonymous')}</p>
      </div>
      
      <p class="text-white/70 mb-6">${t('game.clickReadyHint')}</p>
      
      <button id="ready-btn" class="btn btn-primary btn-lg">${t('game.imReady')}</button>
      
      <p class="text-white/50 text-sm mt-6">${t('game.you')}: ${t('game.player')} ${playerNumber} (${playerNumber === 1 ? t('game.red') : t('game.blue')})</p>
    </div>
  `;

	document.getElementById('ready-btn')?.addEventListener('click', () => {
		gameSocket.ready();
		const btn = document.getElementById('ready-btn')!;
		btn.textContent = t('game.waitingForOpponent');
		btn.classList.add('opacity-50');
		(btn as HTMLButtonElement).disabled = true;
	});

	const unsubGameStart = gameSocket.on('game_start', (data) => {
		// Unsubscribe disconnect listener when game starts
		// Game will have its own disconnect handling
		unsubDisconnect();

		if (data.state) {
			onGameStart(data.state);
		}
	});

	const unsubDisconnect = gameSocket.on('opponent_disconnected', () => {
		alert(t('game.opponentDisconnected'));
		showOnlineLobby();
	});

	cleanupManager.add(unsubGameStart);
	cleanupManager.add(unsubDisconnect);
}

export function startInviteGame(
	content: HTMLElement,
	roomId: string,
	cleanupManager: CleanupManager,
	onCancel: () => void,
	setPlayerNumber: (num: PlayerNumber) => void,
	setCurrentRoomId: (id: string) => void,
	showWaitingRoom: (roomId: string) => void,
	showReadyScreen: (opponentName?: string) => void,
	invitedUserId?: number
): void {
	console.log('[Game] Starting invite game for room:', roomId, 'invitedUserId:', invitedUserId);
	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-pong-primary mb-8">${t('game.gameInvitation')}</h2>
      
      <div class="card mb-6">
        <p class="text-white/80 mb-4">${t('game.joiningPrivateRoom')} <span class="text-pong-secondary">${roomId}</span></p>
        <div class="loading-spinner mx-auto"></div>
      </div>
      
      <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
    </div>
  `;

	document.getElementById('cancel-btn')?.addEventListener('click', () => {
		console.log('[Game] Invite cancelled');
		onCancel();
	});

	// Set up event handlers FIRST before connecting
	const unsubWildcard = gameSocket.on('*', (data) => {
		console.log('[Game] Socket received ANY message:', data);
	});

	const unsubError = gameSocket.on('error', (data) => {
		console.log('[Game] Socket error:', data);
		if (data.message === 'Room not found or full') {
			// Room doesn't exist yet, we must be the inviter. Create it.
			console.log('[Game] Room not found, creating it with invitedUserId:', invitedUserId);
			// Pass invitedUserId to make this a private room
			gameSocket.createRoom(roomId, invitedUserId);
		} else {
			alert(data.message || 'Game error');
			onCancel();
		}
	});

	const unsubRoomCreated = gameSocket.on('room_created', (data) => {
		console.log('[Game] Room created event:', data);
		if (data.roomId === roomId) {
			setPlayerNumber(1);
			setCurrentRoomId(roomId);
			showWaitingRoom(roomId);
		}
	});

	const unsubRoomJoined = gameSocket.on('room_joined', (data) => {
		console.log('[Game] Room joined event:', data);
		if (data.roomId === roomId) {
			setPlayerNumber(2);
			setCurrentRoomId(roomId);
			showReadyScreen((data as { hostUsername?: string }).hostUsername || 'Friend');
		}
	});

	cleanupManager.add(unsubWildcard);
	cleanupManager.add(unsubError);
	cleanupManager.add(unsubRoomCreated);
	cleanupManager.add(unsubRoomJoined);

	// Now connect
	console.log('[Game] Connecting to socket...');
	gameSocket.connect().then(() => {
		console.log('[Game] Socket connected successfully, isConnected:', gameSocket.isConnected());
		console.log('[Game] Sending join_room for:', roomId);
		gameSocket.joinRoom(roomId);
	}).catch((err) => {
		console.error('[Game] Connection failed:', err);
		content.innerHTML = `
      <div class="max-w-lg mx-auto px-4 py-8 text-center">
        <h2 class="font-game text-2xl text-red-500 mb-4">Connection Failed</h2>
        <p class="text-white/80 mb-6">Could not connect to game server.</p>
        <button id="back-btn" class="btn btn-secondary">Back to Menu</button>
      </div>
    `;
		document.getElementById('back-btn')?.addEventListener('click', onCancel);
	});
}

export function startOnlineGame(
	content: HTMLElement,
	initialState: GameState,
	playerNumber: PlayerNumber,
	currentRoomId: string | null,
	cleanupManager: CleanupManager
): void {
	console.log('[Game] Starting online game');

	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <span class="badge ${playerNumber === 1 ? 'badge-online' : 'badge-offline'}">
          ${t('game.you')}: ${t('game.player')} ${playerNumber} (${playerNumber === 1 ? t('game.red') : t('game.blue')})
        </span>
        <span class="text-white/60 text-sm">Room: ${currentRoomId}</span>
      </div>
      
      <div class="card p-2 relative">
        <canvas id="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" class="w-full bg-pong-darker rounded-lg"></canvas>
        <div id="game-over-container"></div>
      </div>
      
      <p class="text-center text-white/60 text-sm mt-4">
        <span class="hidden md:inline">${t('game.useArrows')}</span>
        <span class="md:hidden">${t('game.swipeInstructions')}</span>
      </p>
    </div>
  `;

	initOnlineGame(initialState, playerNumber, cleanupManager);
}

function initOnlineGame(
	initialState: GameState,
	playerNumber: PlayerNumber,
	cleanupManager: CleanupManager
): void {
	const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
	if (!canvas) return;
	const ctx = canvas.getContext('2d')!;

	let gameState = initialState;
	let myPaddleY = playerNumber === 1 ? gameState.paddles.player1 : gameState.paddles.player2;
	let animationFrameId: number | null = null;
	let intentionalDisconnect = false; // Flag to track intentional disconnects

	// Key states
	const keys: Record<string, boolean> = {};

	const keyDownHandler = (e: KeyboardEvent) => {
		keys[e.key] = true;
		// Resume ball when space is pressed and ball is paused
		if (e.key === ' ' && gameState.ballPaused && gameState.status !== 'finished') {
			gameSocket.resumeBall();
		}
		// Navigate back to menu when space is pressed after game over
		if (e.key === ' ' && gameState.status === 'finished') {
			// Mark as intentional disconnect
			intentionalDisconnect = true;
			// Disconnect from game socket
			gameSocket.disconnect();
			// Navigate without reload to preserve language
			setTimeout(() => {
				window.location.hash = '#/game';
			}, 100);
		}
	};
	const keyUpHandler = (e: KeyboardEvent) => {
		keys[e.key] = false;
	};

	window.addEventListener('keydown', keyDownHandler);
	window.addEventListener('keyup', keyUpHandler);
	cleanupManager.add(() => {
		window.removeEventListener('keydown', keyDownHandler);
		window.removeEventListener('keyup', keyUpHandler);
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
	});

	// Touch controls for mobile (single player touches anywhere to control their paddle)
	let touchStartY: number | null = null;
	let touchMoved = false;

	const touchStartHandler = (e: TouchEvent) => {
		if (e.touches.length > 0) {
			touchStartY = e.touches[0].clientY;
			touchMoved = false;
		}
	};

	const touchMoveHandler = (e: TouchEvent) => {
		e.preventDefault(); // Prevent page scrolling
		if (touchStartY !== null && e.touches.length > 0) {
			const deltaY = e.touches[0].clientY - touchStartY;
			myPaddleY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, myPaddleY + deltaY * 2));
			touchStartY = e.touches[0].clientY;
			touchMoved = true;
			gameSocket.movePaddle(myPaddleY);
		}
	};

	const touchEndHandler = () => {
		// If user tapped without swiping and ball is paused, resume it
		if (!touchMoved && gameState.ballPaused && gameState.status !== 'finished') {
			gameSocket.resumeBall();
		}
		// Navigate back to menu when tapped after game over
		if (!touchMoved && gameState.status === 'finished') {
			// Mark as intentional disconnect
			intentionalDisconnect = true;
			// Disconnect from game socket
			gameSocket.disconnect();
			// Navigate without reload
			setTimeout(() => {
				window.location.hash = '#/game';
			}, 100);
		}
		touchStartY = null;
	};

	canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
	canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
	canvas.addEventListener('touchend', touchEndHandler);
	cleanupManager.add(() => {
		canvas.removeEventListener('touchstart', touchStartHandler);
		canvas.removeEventListener('touchmove', touchMoveHandler);
		canvas.removeEventListener('touchend', touchEndHandler);
	});

	// Listen for game state updates
	const unsubState = gameSocket.on('game_state', (data) => {
		if (data.state) {
			gameState = data.state;
		}
	});

	const unsubGameOver = gameSocket.on('game_over', (data) => {
		gameState.status = 'finished';
		gameState.winner = data.winner;
		if (data.state) {
			gameState.score = data.state.score;
		}

		// CRITICAL: Unsubscribe disconnect listener after game over
		// This prevents false "opponent disconnected" alerts when either player leaves
		unsubDisconnect();

		// Show unified overlay only if winner is defined
		if (data.winner) {
			const container = document.getElementById('game-over-container');
			if (container) {
				const customMsg = data.reason === 'opponent_disconnected'
					? t('game.opponentDisconnected')
					: undefined;

				const overlay = showGameOverOverlay({
					playerNumber,
					winner: data.winner,
					customMessage: customMsg
				});
				container.appendChild(overlay);
			}
		}
	});

	const unsubDisconnect = gameSocket.on('opponent_disconnected', () => {
		// This is only called if game was NOT in progress
		// If game was in progress, game_over will be sent instead
		// IMPORTANT: Only show alert if game is not finished AND not intentionally disconnecting
		// If intentionalDisconnect is true, this player is leaving on purpose
		if (gameState.status !== 'finished' && !intentionalDisconnect) {
			gameState.status = 'finished';
			alert(t('game.opponentDisconnected'));
		}
		// If game is finished or intentional disconnect, silently ignore
	});

	cleanupManager.add(unsubState);
	cleanupManager.add(unsubGameOver);
	cleanupManager.add(unsubDisconnect);

	function update(): void {
		if (gameState.status !== 'playing') return;

		// Move my paddle
		let moved = false;
		if (keys['w'] || keys['W'] || keys['ArrowUp']) {
			myPaddleY = Math.max(0, myPaddleY - PADDLE_SPEED);
			moved = true;
		}
		if (keys['s'] || keys['S'] || keys['ArrowDown']) {
			myPaddleY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, myPaddleY + PADDLE_SPEED);
			moved = true;
		}

		if (moved) {
			gameSocket.movePaddle(myPaddleY);
		}
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

		drawScore(ctx, gameState.score.player1, gameState.score.player2, {
			score1X: p1ScoreX,
			score2X: p2ScoreX
		});

		// Pause message only (winner is shown in overlay)
		if (gameState.ballPaused && gameState.status !== 'finished') {
			// Show pause message when ball is waiting for input
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
