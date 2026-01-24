// Game Page
// Pong game with local and online multiplayer modes

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import { gameSocket, GameState } from '../utils/gameSocket';
import { router } from '../utils/router';
import api from '../utils/api';

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 60; // Reduced from 80
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const PADDLE_SPEED = 8;
const BALL_SPEED = 7; // Increased from 5
const BALL_SPEED_INCREMENT = 0.3;
const BALL_MAX_SPEED = 15; // Kept as cap for now, but client loop will ignore if desired
const WINNING_SCORE = 5;

type GameMode = 'menu' | 'local' | 'online-lobby' | 'online-waiting' | 'online-playing' | 'online-tournament';

let currentMode: GameMode = 'menu';
let animationFrameId: number | null = null;
let playerNumber: 1 | 2 = 1;
let currentRoomId: string | null = null;
let currentTournamentId: number | null = null;
let currentTournamentMatchId: number | null = null;

// Cleanup function
let cleanupFunctions: (() => void)[] = [];

export function renderGamePage(): void {
	renderNavbar();

	const app = document.getElementById('app');
	if (!app) return;

	// Cleanup previous game
	cleanup();

	let content = document.getElementById('page-content');
	if (!content) {
		content = document.createElement('div');
		content.id = 'page-content';
		app.appendChild(content);
	}

	// Check for tournament mode
	const urlParams = new URLSearchParams(window.location.search);
	const mode = urlParams.get('mode');

	if (mode === 'online-tournament') {
		const tournamentId = urlParams.get('tournamentId');
		const matchId = urlParams.get('matchId');

		if (tournamentId && matchId) {
			renderNavbar();
			currentTournamentId = parseInt(tournamentId);
			currentTournamentMatchId = parseInt(matchId);
			startOnlineTournament(content, currentTournamentId, currentTournamentMatchId);
			return;
		}
	}

	if (mode === 'invite') {
		const roomId = urlParams.get('roomId');
		const invitedUserId = urlParams.get('invitedUserId');
		if (roomId) {
			renderNavbar();
			startInviteGame(content, roomId, invitedUserId ? parseInt(invitedUserId) : undefined);
			return;
		}
	}

	renderNavbar();
	currentMode = 'menu';
	renderGameMenu(content);
}

function cleanup(): void {
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
	cleanupFunctions.forEach(fn => fn());
	cleanupFunctions = [];
	gameSocket.disconnect();
}

function renderGameMenu(content: HTMLElement): void {
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

	document.getElementById('local-play-card')?.addEventListener('click', () => startLocalGame(content));
	document.getElementById('ai-play-card')?.addEventListener('click', () => startAIGame(content));
	document.getElementById('online-play-card')?.addEventListener('click', () => showOnlineLobby(content));
}


// ====================== AI GAME ======================

function startAIGame(content: HTMLElement): void {
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

	document.getElementById('cancel-btn')?.addEventListener('click', () => {
		cleanup();
		renderGameMenu(content);
	});

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
		document.getElementById('back-btn')?.addEventListener('click', () => renderGameMenu(content));
	});

	// Handle AI room created
	const unsubAIRoom = gameSocket.on('ai_room_created', (data) => {
		playerNumber = 1;
		currentRoomId = data.roomId || null;
		showAIReadyScreen(content);
	});

	cleanupFunctions.push(unsubAIRoom);
}

function showAIReadyScreen(content: HTMLElement): void {
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
		if (data.state) {
			startOnlineGame(content, data.state); // Reuse online game UI
		}
	});

	cleanupFunctions.push(unsubGameStart);
}

// ====================== LOCAL GAME ======================

function startLocalGame(content: HTMLElement): void {
	currentMode = 'local';

	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <button id="back-btn" class="btn btn-secondary text-sm">← ${t('common.back')}</button>
        <h2 class="font-game text-xl text-pong-primary">${t('game.localPlay')}</h2>
        <div class="w-20"></div>
      </div>
      
      <div class="card p-2">
        <canvas id="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" class="w-full bg-pong-darker rounded-lg"></canvas>
      </div>
      
      <p class="text-center text-white/60 text-sm mt-4">
        Player 1: W/S • Player 2: ↑/↓ • Press SPACE to start
      </p>
    </div>
  `;

	document.getElementById('back-btn')?.addEventListener('click', () => {
		cleanup();
		renderGameMenu(content);
	});

	initLocalGame();
}

function initLocalGame(): void {
	const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
	if (!canvas) return;
	const ctx = canvas.getContext('2d')!;

	// Game state
	let paddle1Y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
	let paddle2Y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
	let ballX = CANVAS_WIDTH / 2;
	let ballY = CANVAS_HEIGHT / 2;
	let ballVX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
	let ballVY = (Math.random() - 0.5) * BALL_SPEED;
	let score1 = 0;
	let score2 = 0;
	let gameRunning = false;
	let winner: 1 | 2 | null = null;

	// Key states
	const keys: Record<string, boolean> = {};

	const keyDownHandler = (e: KeyboardEvent) => {
		keys[e.key] = true;
		if (e.key === ' ' && !gameRunning && !winner) {
			gameRunning = true;
		}
		if (e.key === ' ' && winner) {
			// Restart
			score1 = 0;
			score2 = 0;
			winner = null;
			resetBall();
		}
	};

	const keyUpHandler = (e: KeyboardEvent) => {
		keys[e.key] = false;
	};

	window.addEventListener('keydown', keyDownHandler);
	window.addEventListener('keyup', keyUpHandler);
	cleanupFunctions.push(() => {
		window.removeEventListener('keydown', keyDownHandler);
		window.removeEventListener('keyup', keyUpHandler);
	});

	// Touch controls for mobile
	let touchStartY1: number | null = null;
	let touchStartY2: number | null = null;

	const touchStartHandler = (e: TouchEvent) => {
		if (!gameRunning && !winner) {
			gameRunning = true;
		}
		if (winner) {
			// Restart on touch when game is over
			score1 = 0;
			score2 = 0;
			winner = null;
			resetBall();
			return;
		}

		Array.from(e.touches).forEach(touch => {
			const rect = canvas.getBoundingClientRect();
			const touchX = touch.clientX - rect.left;

			// Left half - player 1, Right half - player 2
			if (touchX < rect.width / 2) {
				touchStartY1 = touch.clientY;
			} else {
				touchStartY2 = touch.clientY;
			}
		});
	};

	const touchMoveHandler = (e: TouchEvent) => {
		e.preventDefault(); // Prevent scrolling while playing

		Array.from(e.touches).forEach(touch => {
			const rect = canvas.getBoundingClientRect();
			const touchX = touch.clientX - rect.left;

			if (touchX < rect.width / 2 && touchStartY1 !== null) {
				// Player 1 - left half
				const deltaY = touch.clientY - touchStartY1;
				paddle1Y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle1Y + deltaY * 2));
				touchStartY1 = touch.clientY;
			} else if (touchX >= rect.width / 2 && touchStartY2 !== null) {
				// Player 2 - right half
				const deltaY = touch.clientY - touchStartY2;
				paddle2Y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle2Y + deltaY * 2));
				touchStartY2 = touch.clientY;
			}
		});
	};

	const touchEndHandler = () => {
		touchStartY1 = null;
		touchStartY2 = null;
	};

	canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
	canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
	canvas.addEventListener('touchend', touchEndHandler);
	cleanupFunctions.push(() => {
		canvas.removeEventListener('touchstart', touchStartHandler);
		canvas.removeEventListener('touchmove', touchMoveHandler);
		canvas.removeEventListener('touchend', touchEndHandler);
	});

	// Track if it's the first serve (for random direction)
	let isFirstServe = true;

	function resetBall(direction?: 'left' | 'right'): void {
		ballX = CANVAS_WIDTH / 2;
		ballY = CANVAS_HEIGHT / 2;
		// First serve: random direction. After scoring: ball goes to loser
		if (direction === 'left') {
			ballVX = -BALL_SPEED;
		} else if (direction === 'right') {
			ballVX = BALL_SPEED;
		} else {
			// First serve or no direction specified: random
			ballVX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
		}
		ballVY = (Math.random() - 0.5) * BALL_SPEED;
		gameRunning = false;
		isFirstServe = false;
	}

	function update(deltaTime: number): void {
		if (!gameRunning || winner) return;

		// Normalize delta time to 60 FPS (16.67ms per frame)
		// This ensures consistent speed across different frame rates
		const speedMultiplier = deltaTime / 16.67;

		// Move paddles
		const paddleMove = PADDLE_SPEED * speedMultiplier;
		if (keys['w'] || keys['W']) paddle1Y = Math.max(0, paddle1Y - paddleMove);
		if (keys['s'] || keys['S']) paddle1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle1Y + paddleMove);
		if (keys['ArrowUp']) paddle2Y = Math.max(0, paddle2Y - paddleMove);
		if (keys['ArrowDown']) paddle2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle2Y + paddleMove);

		// Move ball
		ballX += ballVX * speedMultiplier;
		ballY += ballVY * speedMultiplier;

		// Top/bottom collision
		if (ballY <= 0 || ballY >= CANVAS_HEIGHT - BALL_SIZE) {
			ballVY *= -1;
		}

		// Paddle 1 collision
		if (ballX <= PADDLE_WIDTH + BALL_SIZE && ballY + BALL_SIZE >= paddle1Y && ballY <= paddle1Y + PADDLE_HEIGHT) {
			// Calculate current speed
			const currentSpeed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);

			// Calculate hit position for angle adjustment (-0.5 to 0.5)
			const hitPos = (ballY - paddle1Y) / PADDLE_HEIGHT - 0.5;

			// Always increase speed - NO CAP!
			const newSpeed = currentSpeed + BALL_SPEED_INCREMENT;

			// Preserve current angle and add subtle variation based on hit position
			const currentAngle = Math.atan2(ballVY, Math.abs(ballVX));
			const angleAdjustment = hitPos * 0.6;
			const newAngle = currentAngle + angleAdjustment;

			// Apply new velocity (going right)
			ballVX = newSpeed * Math.cos(newAngle);
			ballVY = newSpeed * Math.sin(newAngle);
			ballX = PADDLE_WIDTH + BALL_SIZE;
		}

		// Paddle 2 collision
		if (ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE && ballY + BALL_SIZE >= paddle2Y && ballY <= paddle2Y + PADDLE_HEIGHT) {
			// Calculate current speed
			const currentSpeed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);

			// Calculate hit position for angle adjustment (-0.5 to 0.5)
			const hitPos = (ballY - paddle2Y) / PADDLE_HEIGHT - 0.5;

			// Always increase speed - NO CAP!
			const newSpeed = currentSpeed + BALL_SPEED_INCREMENT;

			// Preserve current angle and add subtle variation based on hit position
			const currentAngle = Math.atan2(ballVY, Math.abs(ballVX));
			const angleAdjustment = hitPos * 0.6;
			const newAngle = currentAngle + angleAdjustment;

			// Apply new velocity (going left)
			ballVX = -newSpeed * Math.cos(newAngle);
			ballVY = newSpeed * Math.sin(newAngle);
			ballX = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
		}

		// Scoring
		if (ballX < 0) {
			score2++;
			if (score2 >= WINNING_SCORE) winner = 2;
			else resetBall('left'); // Ball goes to player 1 (left) who just got scored on
		}
		if (ballX > CANVAS_WIDTH) {
			score1++;
			if (score1 >= WINNING_SCORE) winner = 1;
			else resetBall('right'); // Ball goes to player 2 (right) who just got scored on
		}
	}

	function render(): void {
		// Clear - Pong Table Green
		ctx.fillStyle = '#326255';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Center line (net)
		ctx.setLineDash([10, 10]);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Paddles - Red (P1) and Blue (P2)
		ctx.fillStyle = '#C0392B';
		ctx.fillRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = '#3498DB';
		ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

		// Ball - Orange Circle
		ctx.fillStyle = '#EA871E';
		ctx.beginPath();
		ctx.arc(ballX + BALL_SIZE / 2, ballY + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
		ctx.fill();

		// Score
		ctx.font = '48px Orbitron, monospace';
		ctx.fillStyle = '#C0392B';
		ctx.textAlign = 'center';
		ctx.fillText(score1.toString(), CANVAS_WIDTH / 4, 60);
		ctx.fillStyle = '#3498DB';
		ctx.fillText(score2.toString(), (CANVAS_WIDTH / 4) * 3, 60);

		// Instructions or winner
		ctx.font = '16px Inter, sans-serif';
		ctx.fillStyle = '#666';
		if (winner) {
			ctx.font = '32px Orbitron, monospace';
			ctx.fillStyle = winner === 1 ? '#C0392B' : '#3498DB';
			ctx.fillText(`Player ${winner} Wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
			ctx.font = '16px Inter, sans-serif';
			ctx.fillStyle = 'rgba(255,255,255,0.7)';
			ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
		} else if (!gameRunning) {
			ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

	let lastTime = performance.now();

	function gameLoop(currentTime: number): void {
		// Calculate delta time in milliseconds
		const deltaTime = currentTime - lastTime;
		lastTime = currentTime;

		update(deltaTime);
		render();
		animationFrameId = requestAnimationFrame(gameLoop);
	}

	gameLoop(performance.now());
}

// ====================== ONLINE GAME ======================

function showOnlineLobby(content: HTMLElement): void {
	currentMode = 'online-lobby';

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
		cleanup();
		renderGameMenu(content);
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
	cleanupFunctions.push(() => {
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
		playerNumber = data.player || 1;
		currentRoomId = data.roomId || null;
		if (refreshInterval) clearInterval(refreshInterval);
		showWaitingRoom(content, data.roomId!);
	});

	const unsubRoomJoined = gameSocket.on('room_joined', (data) => {
		playerNumber = data.player || 2;
		currentRoomId = data.roomId || null;
		if (refreshInterval) clearInterval(refreshInterval);
		// Player 2 goes directly to Ready screen (opponent already exists)
		showReadyScreen(content, (data as { hostUsername?: string }).hostUsername || 'Opponent');
	});

	const unsubError = gameSocket.on('error', (data) => {
		errorDiv.textContent = data.message || 'An error occurred';
		errorDiv.classList.remove('hidden');
	});

	cleanupFunctions.push(unsubRoomCreated, unsubRoomJoined, unsubError);
}

function showWaitingRoom(content: HTMLElement, roomId: string): void {
	console.log('[Game] Showing waiting room for:', roomId);
	currentMode = 'online-waiting';

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

	document.getElementById('cancel-btn')?.addEventListener('click', () => {
		cleanup();
		renderGameMenu(content);
	});

	// Listen for opponent joining
	const unsubOpponentJoined = gameSocket.on('opponent_joined', (data) => {
		showReadyScreen(content, data.username);
	});

	// Handle host disconnecting (fallback, shouldn't happen here but just in case)
	const unsubDisconnect = gameSocket.on('opponent_disconnected', () => {
		alert(t('game.roomClosed'));
		cleanup();
		showOnlineLobby(content);
	});

	cleanupFunctions.push(unsubOpponentJoined, unsubDisconnect);
}

function showReadyScreen(content: HTMLElement, opponentName?: string): void {
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
		if (data.state) {
			// Use tournament IDs to detect tournament mode (more reliable than currentMode)
			if (currentTournamentId && currentTournamentMatchId) {
				startOnlineTournamentGame(content, data.state, currentTournamentId, currentTournamentMatchId);
			} else {
				startOnlineGame(content, data.state);
			}
		}
	});

	const unsubDisconnect = gameSocket.on('opponent_disconnected', () => {
		alert(t('game.opponentDisconnected'));
		cleanup();
		showOnlineLobby(content);
	});

	cleanupFunctions.push(unsubGameStart, unsubDisconnect);
}

function startInviteGame(content: HTMLElement, roomId: string, invitedUserId?: number): void {
	console.log('[Game] Starting invite game for room:', roomId, 'invitedUserId:', invitedUserId);
	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-pong-primary mb-8">Game Invitation</h2>
      
      <div class="card mb-6">
        <p class="text-white/80 mb-4">Joining private room: <span class="text-pong-secondary">${roomId}</span></p>
        <div class="loading-spinner mx-auto"></div>
      </div>
      
      <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
    </div>
  `;

	document.getElementById('cancel-btn')?.addEventListener('click', () => {
		console.log('[Game] Invite cancelled');
		cleanup();
		renderGameMenu(content);
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
			cleanup();
			renderGameMenu(content);
		}
	});

	const unsubRoomCreated = gameSocket.on('room_created', (data) => {
		console.log('[Game] Room created event:', data);
		if (data.roomId === roomId) {
			playerNumber = 1;
			currentRoomId = roomId;
			showWaitingRoom(content, roomId);
		}
	});

	const unsubRoomJoined = gameSocket.on('room_joined', (data) => {
		console.log('[Game] Room joined event:', data);
		if (data.roomId === roomId) {
			playerNumber = 2;
			currentRoomId = roomId;
			showReadyScreen(content, (data as { hostUsername?: string }).hostUsername || 'Friend');
		}
	});

	cleanupFunctions.push(unsubWildcard, unsubError, unsubRoomCreated, unsubRoomJoined);

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
		document.getElementById('back-btn')?.addEventListener('click', () => renderGameMenu(content));
	});
}

function startOnlineGame(content: HTMLElement, initialState: GameState): void {
	console.log('[Game] Starting online game');
	currentMode = 'online-playing';

	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <span class="badge ${playerNumber === 1 ? 'badge-online' : 'badge-offline'}">
          ${t('game.you')}: ${t('game.player')} ${playerNumber} (${playerNumber === 1 ? t('game.red') : t('game.blue')})
        </span>
        <span class="text-white/60 text-sm">Room: ${currentRoomId}</span>
      </div>
      
      <div class="card p-2">
        <canvas id="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" class="w-full bg-pong-darker rounded-lg"></canvas>
      </div>
      
      <p class="text-center text-white/60 text-sm mt-4">
        <span class="hidden md:inline">${t('game.useArrows')}</span>
        <span class="md:hidden">Swipe up/down on screen to move your paddle</span>
      </p>
    </div>
  `;

	initOnlineGame(initialState);
}

function initOnlineGame(initialState: GameState): void {
	const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
	if (!canvas) return;
	const ctx = canvas.getContext('2d')!;

	let gameState = initialState;
	let myPaddleY = playerNumber === 1 ? gameState.paddles.player1 : gameState.paddles.player2;

	// Key states
	const keys: Record<string, boolean> = {};

	const keyDownHandler = (e: KeyboardEvent) => {
		keys[e.key] = true;
		// Resume ball when space is pressed and ball is paused
		if (e.key === ' ' && gameState.ballPaused) {
			gameSocket.resumeBall();
		}
	};
	const keyUpHandler = (e: KeyboardEvent) => {
		keys[e.key] = false;
	};

	window.addEventListener('keydown', keyDownHandler);
	window.addEventListener('keyup', keyUpHandler);
	cleanupFunctions.push(() => {
		window.removeEventListener('keydown', keyDownHandler);
		window.removeEventListener('keyup', keyUpHandler);
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
		if (!touchMoved && gameState.ballPaused) {
			gameSocket.resumeBall();
		}
		touchStartY = null;
	};

	canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
	canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
	canvas.addEventListener('touchend', touchEndHandler);
	cleanupFunctions.push(() => {
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
		// If opponent disconnected, show a message
		if (data.reason === 'opponent_disconnected') {
			console.log('Opponent disconnected, you win!');
		}
	});

	const unsubDisconnect = gameSocket.on('opponent_disconnected', () => {
		// This is only called if game was NOT in progress
		// If game was in progress, game_over will be sent instead
		if (gameState.status !== 'finished') {
			gameState.status = 'finished';
			alert('Opponent disconnected!');
		}
	});

	cleanupFunctions.push(unsubState, unsubGameOver, unsubDisconnect);

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

		// Clear - Pong Table Green
		ctx.fillStyle = '#326255';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Center line (net)
		ctx.setLineDash([10, 10]);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Paddles
		// Internal P1 is Green, Internal P2 is Blue
		const p1X = flipX(0, PADDLE_WIDTH);
		const p2X = flipX(CANVAS_WIDTH - PADDLE_WIDTH, PADDLE_WIDTH);

		ctx.fillStyle = '#C0392B'; // P1 color - Red
		ctx.fillRect(p1X, gameState.paddles.player1, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = '#3498DB'; // P2 color - Blue
		ctx.fillRect(p2X, gameState.paddles.player2, PADDLE_WIDTH, PADDLE_HEIGHT);

		// Ball - Orange Circle
		const ballX = flipX(gameState.ball.x, BALL_SIZE);
		ctx.fillStyle = '#EA871E';
		ctx.beginPath();
		ctx.arc(ballX + BALL_SIZE / 2, gameState.ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
		ctx.fill();

		// Score
		const p1ScoreX = isP2 ? (CANVAS_WIDTH / 4) * 3 : CANVAS_WIDTH / 4;
		const p2ScoreX = isP2 ? CANVAS_WIDTH / 4 : (CANVAS_WIDTH / 4) * 3;

		ctx.font = '48px Orbitron, monospace';
		ctx.fillStyle = '#C0392B';
		ctx.textAlign = 'center';
		ctx.fillText(gameState.score.player1.toString(), p1ScoreX, 60);
		ctx.fillStyle = '#3498DB';
		ctx.fillText((gameState.score.player2.toString()), p2ScoreX, 60);

		// Winner
		if (gameState.status === 'finished' && gameState.winner) {
			ctx.font = '32px Orbitron, monospace';
			const isWinner = gameState.winner === playerNumber;
			ctx.fillStyle = isWinner ? '#C0392B' : '#3498DB';
			const message = isWinner ? t('game.youWin') : t('game.youLose');
			ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		} else if (gameState.ballPaused) {
			// Show pause message when ball is waiting for input
			ctx.font = '16px Inter, sans-serif';
			ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
			ctx.fillText(t('game.pressSpace'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

	function gameLoop(): void {
		update();
		render();
		animationFrameId = requestAnimationFrame(gameLoop);
	}

	gameLoop();
}

// ====================== ONLINE TOURNAMENT ======================

function startOnlineTournament(content: HTMLElement, tournamentId: number, matchId: number): void {
	currentMode = 'online-tournament';

	content.innerHTML = `
		<div class="max-w-lg mx-auto px-4 py-8 text-center">
			<h2 class="font-game text-2xl text-yellow-500 mb-8">Tournament Match</h2>
			<div id="connection-status" class="text-center text-white/60 text-sm mb-4">Connecting to match...</div>
			<div id="tournament-lobby-error" class="hidden bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm mb-4"></div>
			
			<div class="card p-6">
				<p class="text-white/80 mb-2">Match ID:</p>
				<p class="font-game text-2xl text-gradient">${matchId}</p>
			</div>
		</div>
	`;

	const statusDiv = document.getElementById('connection-status')!;
	const errorDiv = document.getElementById('tournament-lobby-error')!;

	gameSocket.connect().then(() => {
		statusDiv.textContent = 'Connected. Joining match...';
		// Send custom message to join tournament match
		gameSocket.send({ type: 'join_tournament_match', roomId: matchId.toString() });
	}).catch(() => {
		statusDiv.textContent = 'Connection failed';
		statusDiv.classList.add('text-red-400');
	});

	const unsubRoomCreated = gameSocket.on('room_created', (data) => {
		playerNumber = data.player || 1;
		currentRoomId = data.roomId || null;
		showWaitingRoom(content, data.roomId!);
	});

	const unsubRoomJoined = gameSocket.on('room_joined', (data) => {
		playerNumber = data.player || 2;
		currentRoomId = data.roomId || null;
		// Ensure tournament variables are set before showReadyScreen
		currentTournamentId = tournamentId;
		currentTournamentMatchId = matchId;
		showReadyScreen(content, (data as any).hostUsername || 'Opponent');
	});

	const unsubError = gameSocket.on('error', (data) => {
		errorDiv.textContent = data.message || 'An error occurred';
		errorDiv.classList.remove('hidden');
	});

	cleanupFunctions.push(unsubRoomCreated, unsubRoomJoined, unsubError);
}

function startOnlineTournamentGame(content: HTMLElement, initialState: GameState, tournamentId: number, matchId: number): void {
	currentMode = 'online-tournament';
	renderNavbar();

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
	cleanupFunctions.push(() => {
		window.removeEventListener('keydown', keyDownHandler);
		window.removeEventListener('keyup', keyUpHandler);
	});

	function navigateToTournament() {
		cleanup();
		router.navigate(`/tournament/${tournamentId}`);
	}

	const unsubState = gameSocket.on('game_state', (data) => {
		if (data.state) gameState = data.state;
	});

	const unsubGameOver = gameSocket.on('game_over', async (data) => {
		gameState.status = 'finished';
		gameState.winner = data.winner;
		if (data.state) gameState.score = data.state.score;

		const isWinner = gameState.winner === playerNumber;
		const resultText = isWinner ? t('game.youWin') : t('game.youLose');
		const resultColor = isWinner ? 'text-green-400' : 'text-red-400';

		// Show overlay with result
		if (savingOverlay) {
			const spinner = savingOverlay.querySelector('.loading-spinner');
			const text = savingOverlay.querySelector('p');
			if (spinner) spinner.classList.add('hidden');
			if (text) text.innerHTML = `
				<div class="text-3xl font-game ${resultColor} mb-4">${resultText}</div>
				<div class="text-white/80">${t('game.savingResult')}</div>
			`;
			savingOverlay.classList.remove('hidden');
		}

		try {
			const score1 = data.state?.score?.player1 ?? gameState.score.player1;
			const score2 = data.state?.score?.player2 ?? gameState.score.player2;

			const result = await api.post(`/tournaments/${tournamentId}/match/${matchId}/result`, {
				player1Score: score1,
				player2Score: score2
			});

			// Show return instructions regardless of save result (other player may have saved already)
			if (savingOverlay) {
				const text = savingOverlay.querySelector('p');
				if (text) text.innerHTML = `
					<div class="text-3xl font-game ${resultColor} mb-4">${resultText}</div>
					<div class="text-white/80">${t('game.pressSpace')}</div>
				`;
			}
			resultSaved = true;
		} catch (err) {
			console.error('Error saving result:', err);
			// Still show return instructions
			if (savingOverlay) {
				const text = savingOverlay.querySelector('p');
				if (text) text.innerHTML = `
					<div class="text-3xl font-game ${resultColor} mb-4">${resultText}</div>
					<div class="text-white/80">${t('game.pressSpace')}</div>
				`;
			}
		}
	});

	cleanupFunctions.push(unsubState, unsubGameOver);

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

		// Clear - Pong Table Green (consistent with all modes)
		ctx.fillStyle = '#326255';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Center line (net)
		ctx.setLineDash([10, 10]);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Paddles - Red (P1) and Blue (P2)
		const p1X = flipX(0, PADDLE_WIDTH);
		const p2X = flipX(CANVAS_WIDTH - PADDLE_WIDTH, PADDLE_WIDTH);

		ctx.fillStyle = '#C0392B'; // P1 color - Red
		ctx.fillRect(p1X, gameState.paddles.player1, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = '#3498DB'; // P2 color - Blue
		ctx.fillRect(p2X, gameState.paddles.player2, PADDLE_WIDTH, PADDLE_HEIGHT);

		// Ball - Orange Circle
		const ballX = flipX(gameState.ball.x, BALL_SIZE);
		ctx.fillStyle = '#EA871E';
		ctx.beginPath();
		ctx.arc(ballX + BALL_SIZE / 2, gameState.ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
		ctx.fill();

		// Score
		const p1ScoreX = isP2 ? (CANVAS_WIDTH / 4) * 3 : CANVAS_WIDTH / 4;
		const p2ScoreX = isP2 ? CANVAS_WIDTH / 4 : (CANVAS_WIDTH / 4) * 3;

		ctx.font = '48px Orbitron, monospace';
		ctx.fillStyle = '#C0392B';
		ctx.textAlign = 'center';
		ctx.fillText(gameState.score.player1.toString(), p1ScoreX, 60);
		ctx.fillStyle = '#3498DB';
		ctx.fillText(gameState.score.player2.toString(), p2ScoreX, 60);

		if (gameState.status === 'finished' && gameState.winner) {
			ctx.font = '32px Orbitron, monospace';
			const isWinner = gameState.winner === playerNumber;
			ctx.fillStyle = isWinner ? '#C0392B' : '#3498DB';
			ctx.fillText(isWinner ? t('game.youWin') : t('game.youLose'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		} else if (gameState.ballPaused) {
			// Show pause message when ball is waiting for input
			ctx.font = '16px Inter, sans-serif';
			ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
			ctx.fillText(t('game.pressSpace'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

	function gameLoop(): void {
		update();
		render();
		animationFrameId = requestAnimationFrame(gameLoop);
	}

	gameLoop();
}
