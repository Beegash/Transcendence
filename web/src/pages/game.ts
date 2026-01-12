/**
 * Game Page
 * Pong game with local and online multiplayer modes
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import { gameSocket, GameState } from '../utils/gameSocket';
import { router } from '../utils/router';
import api from '../utils/api';

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const PADDLE_SPEED = 8;
const BALL_SPEED = 5;
const WINNING_SCORE = 5;

type GameMode = 'menu' | 'local' | 'online-lobby' | 'online-waiting' | 'online-playing';

let currentMode: GameMode = 'menu';
let animationFrameId: number | null = null;
let playerNumber: 1 | 2 = 1;
let currentRoomId: string | null = null;

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

	if (mode === 'tournament') {
		const tournamentId = urlParams.get('tournamentId');
		const matchId = urlParams.get('matchId');
		const p1 = urlParams.get('p1');
		const p2 = urlParams.get('p2');

		if (tournamentId && matchId) {
			startTournamentGame(content, parseInt(tournamentId), parseInt(matchId), p1 || 'Player 1', p2 || 'Player 2');
			return;
		}
	}

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
            <p class="text-gray-400 text-sm">
              ${t('game.localPlayDesc')}
            </p>
            <div class="mt-4 text-gray-500 text-xs">
              Player 1: W/S • Player 2: ↑/↓
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
            <h2 class="font-game text-xl text-yellow-500 mb-2">vs AI</h2>
            <p class="text-gray-400 text-sm">
              Play against an AI opponent
            </p>
            <div class="mt-4 text-gray-500 text-xs">
              AI refreshes view every 1 second
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
            <p class="text-gray-400 text-sm">
              ${t('game.onlinePlayDesc')}
            </p>
            <div class="mt-4 text-gray-500 text-xs">
              Real-time multiplayer
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
      <h2 class="font-game text-2xl text-yellow-500 mb-8">vs AI</h2>
      
      <div class="card mb-6">
        <p class="text-gray-400 mb-4">Connecting to game server...</p>
        <div class="loading-spinner mx-auto"></div>
      </div>
      
      <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
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
        <h2 class="font-game text-2xl text-red-500 mb-4">Connection Failed</h2>
        <p class="text-gray-400 mb-6">Could not connect to game server.</p>
        <button id="back-btn" class="btn btn-secondary">Back to Menu</button>
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
      <h2 class="font-game text-2xl text-yellow-500 mb-8">AI Ready!</h2>
      
      <div class="card mb-6">
        <p class="text-gray-400 mb-2">You are playing against:</p>
        <p class="font-game text-2xl text-yellow-500">AI Opponent</p>
        <p class="text-gray-500 text-sm mt-2">AI updates its view every 1 second</p>
      </div>
      
      <p class="text-gray-500 mb-6">Click Ready to start the game!</p>
      
      <button id="ready-btn" class="btn btn-primary btn-lg">I'm Ready!</button>
      
      <p class="text-gray-600 text-sm mt-6">You are Player 1 (Left - Green)</p>
    </div>
  `;

	document.getElementById('ready-btn')?.addEventListener('click', () => {
		gameSocket.ready();
		const btn = document.getElementById('ready-btn')!;
		btn.textContent = 'Starting game...';
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
      
      <p class="text-center text-gray-500 text-sm mt-4">
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

	function resetBall(): void {
		ballX = CANVAS_WIDTH / 2;
		ballY = CANVAS_HEIGHT / 2;
		ballVX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
		ballVY = (Math.random() - 0.5) * BALL_SPEED;
		gameRunning = false;
	}

	function update(): void {
		if (!gameRunning || winner) return;

		// Move paddles
		if (keys['w'] || keys['W']) paddle1Y = Math.max(0, paddle1Y - PADDLE_SPEED);
		if (keys['s'] || keys['S']) paddle1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle1Y + PADDLE_SPEED);
		if (keys['ArrowUp']) paddle2Y = Math.max(0, paddle2Y - PADDLE_SPEED);
		if (keys['ArrowDown']) paddle2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle2Y + PADDLE_SPEED);

		// Move ball
		ballX += ballVX;
		ballY += ballVY;

		// Top/bottom collision
		if (ballY <= 0 || ballY >= CANVAS_HEIGHT - BALL_SIZE) {
			ballVY *= -1;
		}

		// Paddle 1 collision
		if (ballX <= PADDLE_WIDTH + BALL_SIZE && ballY + BALL_SIZE >= paddle1Y && ballY <= paddle1Y + PADDLE_HEIGHT) {
			ballVX = Math.abs(ballVX);
			const hitPos = (ballY - paddle1Y) / PADDLE_HEIGHT - 0.5;
			ballVY += hitPos * 3;
		}

		// Paddle 2 collision
		if (ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE && ballY + BALL_SIZE >= paddle2Y && ballY <= paddle2Y + PADDLE_HEIGHT) {
			ballVX = -Math.abs(ballVX);
			const hitPos = (ballY - paddle2Y) / PADDLE_HEIGHT - 0.5;
			ballVY += hitPos * 3;
		}

		// Scoring
		if (ballX < 0) {
			score2++;
			if (score2 >= WINNING_SCORE) winner = 2;
			else resetBall();
		}
		if (ballX > CANVAS_WIDTH) {
			score1++;
			if (score1 >= WINNING_SCORE) winner = 1;
			else resetBall();
		}
	}

	function render(): void {
		// Clear
		ctx.fillStyle = '#050508';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Center line
		ctx.setLineDash([10, 10]);
		ctx.strokeStyle = '#1a1a2e';
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Paddles
		ctx.fillStyle = '#00ff88';
		ctx.fillRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = '#0088ff';
		ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

		// Ball
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);

		// Score
		ctx.font = '48px Orbitron, monospace';
		ctx.fillStyle = '#00ff88';
		ctx.textAlign = 'center';
		ctx.fillText(score1.toString(), CANVAS_WIDTH / 4, 60);
		ctx.fillStyle = '#0088ff';
		ctx.fillText(score2.toString(), (CANVAS_WIDTH / 4) * 3, 60);

		// Instructions or winner
		ctx.font = '16px Inter, sans-serif';
		ctx.fillStyle = '#666';
		if (winner) {
			ctx.font = '32px Orbitron, monospace';
			ctx.fillStyle = winner === 1 ? '#00ff88' : '#0088ff';
			ctx.fillText(`Player ${winner} Wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
			ctx.font = '16px Inter, sans-serif';
			ctx.fillStyle = '#666';
			ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
		} else if (!gameRunning) {
			ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

	function gameLoop(): void {
		update();
		render();
		animationFrameId = requestAnimationFrame(gameLoop);
	}

	gameLoop();
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
          <h3 class="font-game text-lg text-pong-primary mb-4">Create Room</h3>
          <p class="text-gray-400 text-sm mb-4">Create a new room and share the code with your friend.</p>
          <button id="create-room-btn" class="btn btn-primary w-full">Create Room</button>
        </div>
        
        <!-- Join Room -->
        <div class="card">
          <h3 class="font-game text-lg text-pong-secondary mb-4">Join Room</h3>
          <p class="text-gray-400 text-sm mb-4">Enter a room code to join an existing game.</p>
          <div class="flex gap-2">
            <input type="text" id="room-code-input" class="input flex-1 uppercase" placeholder="ROOM CODE" maxlength="6">
            <button id="join-room-btn" class="btn btn-secondary">Join</button>
          </div>
        </div>
        
        <div id="connection-status" class="text-center text-gray-500 text-sm"></div>
        <div id="lobby-error" class="hidden bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm"></div>
      </div>
    </div>
  `;

	const statusDiv = document.getElementById('connection-status')!;
	const errorDiv = document.getElementById('lobby-error')!;

	document.getElementById('back-btn')?.addEventListener('click', () => {
		cleanup();
		renderGameMenu(content);
	});

	// Connect to WebSocket
	statusDiv.textContent = 'Connecting...';
	gameSocket.connect().then(() => {
		statusDiv.textContent = 'Connected ✓';
		statusDiv.classList.add('text-green-400');
	}).catch(() => {
		statusDiv.textContent = 'Connection failed';
		statusDiv.classList.add('text-red-400');
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
			errorDiv.textContent = 'Room code must be 6 characters';
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
		showWaitingRoom(content, data.roomId!);
	});

	const unsubRoomJoined = gameSocket.on('room_joined', (data) => {
		playerNumber = data.player || 2;
		currentRoomId = data.roomId || null;
		showWaitingRoom(content, data.roomId!);
	});

	const unsubError = gameSocket.on('error', (data) => {
		errorDiv.textContent = data.message || 'An error occurred';
		errorDiv.classList.remove('hidden');
	});

	cleanupFunctions.push(unsubRoomCreated, unsubRoomJoined, unsubError);
}

function showWaitingRoom(content: HTMLElement, roomId: string): void {
	currentMode = 'online-waiting';

	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-pong-primary mb-8">Waiting for Opponent</h2>
      
      <div class="card mb-6">
        <p class="text-gray-400 mb-2">Room Code:</p>
        <p class="font-game text-4xl text-gradient tracking-widest" id="room-id">${roomId}</p>
        <button id="copy-code-btn" class="btn btn-secondary text-sm mt-4">Copy Code</button>
      </div>
      
      <div class="flex items-center justify-center gap-2 text-gray-500">
        <div class="loading-spinner"></div>
        <span>Waiting for Player 2 to join...</span>
      </div>
      
      <p class="text-gray-600 text-sm mt-6">You are Player ${playerNumber}</p>
      
      <button id="cancel-btn" class="btn btn-secondary mt-8">Cancel</button>
    </div>
  `;

	document.getElementById('copy-code-btn')?.addEventListener('click', () => {
		navigator.clipboard.writeText(roomId);
		const btn = document.getElementById('copy-code-btn')!;
		btn.textContent = 'Copied!';
		setTimeout(() => btn.textContent = 'Copy Code', 2000);
	});

	document.getElementById('cancel-btn')?.addEventListener('click', () => {
		cleanup();
		renderGameMenu(content);
	});

	// Listen for opponent joining
	const unsubOpponentJoined = gameSocket.on('opponent_joined', (data) => {
		showReadyScreen(content, data.username);
	});

	cleanupFunctions.push(unsubOpponentJoined);
}

function showReadyScreen(content: HTMLElement, opponentName?: string): void {
	content.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 class="font-game text-2xl text-pong-primary mb-8">Opponent Joined!</h2>
      
      <div class="card mb-6">
        <p class="text-gray-400 mb-2">Playing against:</p>
        <p class="font-game text-2xl text-pong-secondary">${opponentName || 'Anonymous'}</p>
      </div>
      
      <p class="text-gray-500 mb-6">Click Ready when you're prepared to play.</p>
      
      <button id="ready-btn" class="btn btn-primary btn-lg">I'm Ready!</button>
      
      <p class="text-gray-600 text-sm mt-6">You are Player ${playerNumber} (${playerNumber === 1 ? 'Left' : 'Right'})</p>
    </div>
  `;

	document.getElementById('ready-btn')?.addEventListener('click', () => {
		gameSocket.ready();
		const btn = document.getElementById('ready-btn')!;
		btn.textContent = 'Waiting for opponent...';
		btn.classList.add('opacity-50');
		(btn as HTMLButtonElement).disabled = true;
	});

	const unsubGameStart = gameSocket.on('game_start', (data) => {
		if (data.state) {
			startOnlineGame(content, data.state);
		}
	});

	cleanupFunctions.push(unsubGameStart);
}

function startOnlineGame(content: HTMLElement, initialState: GameState): void {
	currentMode = 'online-playing';

	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <span class="badge ${playerNumber === 1 ? 'badge-online' : 'badge-offline'}">
          You: Player ${playerNumber} (${playerNumber === 1 ? 'Left - Green' : 'Right - Blue'})
        </span>
        <span class="text-gray-500 text-sm">Room: ${currentRoomId}</span>
      </div>
      
      <div class="card p-2">
        <canvas id="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" class="w-full bg-pong-darker rounded-lg"></canvas>
      </div>
      
      <p class="text-center text-gray-500 text-sm mt-4">
        Use ↑/↓ or W/S to move your paddle
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

	// Listen for game state updates
	const unsubState = gameSocket.on('game_state', (data) => {
		if (data.state) {
			gameState = data.state;
		}
	});

	const unsubGameOver = gameSocket.on('game_over', (data) => {
		gameState.status = 'finished';
		gameState.winner = data.winner;
	});

	const unsubDisconnect = gameSocket.on('opponent_disconnected', () => {
		gameState.status = 'finished';
		alert('Opponent disconnected!');
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
		// Clear
		ctx.fillStyle = '#050508';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Center line
		ctx.setLineDash([10, 10]);
		ctx.strokeStyle = '#1a1a2e';
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Paddles
		ctx.fillStyle = '#00ff88';
		ctx.fillRect(0, gameState.paddles.player1, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = '#0088ff';
		ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.paddles.player2, PADDLE_WIDTH, PADDLE_HEIGHT);

		// Ball
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(gameState.ball.x, gameState.ball.y, BALL_SIZE, BALL_SIZE);

		// Score
		ctx.font = '48px Orbitron, monospace';
		ctx.fillStyle = '#00ff88';
		ctx.textAlign = 'center';
		ctx.fillText(gameState.score.player1.toString(), CANVAS_WIDTH / 4, 60);
		ctx.fillStyle = '#0088ff';
		ctx.fillText((gameState.score.player2.toString()), (CANVAS_WIDTH / 4) * 3, 60);

		// Winner
		if (gameState.status === 'finished' && gameState.winner) {
			ctx.font = '32px Orbitron, monospace';
			ctx.fillStyle = gameState.winner === playerNumber ? '#00ff88' : '#ff4444';
			const message = gameState.winner === playerNumber ? 'You Win!' : 'You Lose!';
			ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

	function gameLoop(): void {
		update();
		render();
		animationFrameId = requestAnimationFrame(gameLoop);
	}

	gameLoop();
}

// ====================== TOURNAMENT GAME ======================

function startTournamentGame(content: HTMLElement, tournamentId: number, matchId: number, p1: string, p2: string): void {
	currentMode = 'local'; // Uses local game logic

	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-game text-xl text-yellow-500">Tournament Match</h2>
        <div class="text-sm text-gray-400">
           <span class="text-pong-primary">${p1}</span> vs <span class="text-pong-secondary">${p2}</span>
        </div>
      </div>
      
      <div class="card p-2 relative">
        <canvas id="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" class="w-full bg-pong-darker rounded-lg"></canvas>
        <div id="saving-overlay" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center hidden rounded-lg">
            <div class="loading-spinner mb-4"></div>
            <p class="text-white font-game">Saving Result...</p>
        </div>
      </div>
      
      <p class="text-center text-gray-500 text-sm mt-4">
        ${p1}: W/S • ${p2}: ↑/↓ • Press SPACE to start
      </p>
    </div>
  `;

	initTournamentGame(tournamentId, matchId, p1, p2);
}

function initTournamentGame(tournamentId: number, matchId: number, p1Name: string, p2Name: string): void {
	const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
	if (!canvas) return;
	const ctx = canvas.getContext('2d')!;
	const savingOverlay = document.getElementById('saving-overlay');

	// Game state (copied from local game)
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
	let isSaving = false;

	// Key states
	const keys: Record<string, boolean> = {};

	const keyDownHandler = (e: KeyboardEvent) => {
		if (isSaving) return;
		keys[e.key] = true;
		if (e.key === ' ' && !gameRunning && !winner) {
			gameRunning = true;
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

	function resetBall(): void {
		ballX = CANVAS_WIDTH / 2;
		ballY = CANVAS_HEIGHT / 2;
		ballVX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
		ballVY = (Math.random() - 0.5) * BALL_SPEED;
		gameRunning = false;
	}

	async function handleWin(winningPlayer: 1 | 2) {
		winner = winningPlayer;
		gameRunning = false;
		isSaving = true;

		// Show saving overlay after a short delay to see the winner
		setTimeout(async () => {
			if (savingOverlay) savingOverlay.classList.remove('hidden');

			try {
				const result = await api.post(`/tournaments/${tournamentId}/match/${matchId}/result`, {
					player1Score: score1,
					player2Score: score2
				});

				if (result.success) {
					// Navigate back to tournament
					cleanup();
					router.navigate(`/tournament/${tournamentId}`);
				} else {
					alert('Failed to save result: ' + (result.error || 'Unknown error'));
					if (savingOverlay) savingOverlay.classList.add('hidden');
					isSaving = false;
				}
			} catch (err) {
				alert('Failed to save result');
				if (savingOverlay) savingOverlay.classList.add('hidden');
				isSaving = false;
			}
		}, 2000);
	}

	function update(): void {
		if (!gameRunning || winner) return;

		// Move paddles
		if (keys['w'] || keys['W']) paddle1Y = Math.max(0, paddle1Y - PADDLE_SPEED);
		if (keys['s'] || keys['S']) paddle1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle1Y + PADDLE_SPEED);
		if (keys['ArrowUp']) paddle2Y = Math.max(0, paddle2Y - PADDLE_SPEED);
		if (keys['ArrowDown']) paddle2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle2Y + PADDLE_SPEED);

		// Move ball
		ballX += ballVX;
		ballY += ballVY;

		// Top/bottom collision
		if (ballY <= 0 || ballY >= CANVAS_HEIGHT - BALL_SIZE) {
			ballVY *= -1;
		}

		// Paddle 1 collision
		if (ballX <= PADDLE_WIDTH + BALL_SIZE && ballY + BALL_SIZE >= paddle1Y && ballY <= paddle1Y + PADDLE_HEIGHT) {
			ballVX = Math.abs(ballVX);
			const hitPos = (ballY - paddle1Y) / PADDLE_HEIGHT - 0.5;
			ballVY += hitPos * 3;
			// Increase speed slightly
			ballVX *= 1.05;
			ballVY *= 1.05;
		}

		// Paddle 2 collision
		if (ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE && ballY + BALL_SIZE >= paddle2Y && ballY <= paddle2Y + PADDLE_HEIGHT) {
			ballVX = -Math.abs(ballVX);
			const hitPos = (ballY - paddle2Y) / PADDLE_HEIGHT - 0.5;
			ballVY += hitPos * 3;
			// Increase speed slightly
			ballVX *= 1.05;
			ballVY *= 1.05;
		}

		// Scoring
		if (ballX < 0) {
			score2++;
			if (score2 >= WINNING_SCORE) handleWin(2);
			else resetBall();
		}
		if (ballX > CANVAS_WIDTH) {
			score1++;
			if (score1 >= WINNING_SCORE) handleWin(1);
			else resetBall();
		}
	}

	function render(): void {
		// Clear
		ctx.fillStyle = '#050508';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Center line
		ctx.setLineDash([10, 10]);
		ctx.strokeStyle = '#1a1a2e';
		ctx.beginPath();
		ctx.moveTo(CANVAS_WIDTH / 2, 0);
		ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
		ctx.stroke();
		ctx.setLineDash([]);

		// Paddles
		ctx.fillStyle = '#00ff88';
		ctx.fillRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
		ctx.fillStyle = '#0088ff';
		ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

		// Ball
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);

		// Score
		ctx.font = '48px Orbitron, monospace';
		ctx.fillStyle = '#00ff88';
		ctx.textAlign = 'center';
		ctx.fillText(score1.toString(), CANVAS_WIDTH / 4, 60);
		ctx.fillStyle = '#0088ff';
		ctx.fillText(score2.toString(), (CANVAS_WIDTH / 4) * 3, 60);

		// Names
		ctx.font = '14px Inter, sans-serif';
		ctx.fillStyle = '#00ff88';
		ctx.fillText(p1Name, CANVAS_WIDTH / 4, 30);
		ctx.fillStyle = '#0088ff';
		ctx.fillText(p2Name, (CANVAS_WIDTH / 4) * 3, 30);


		// Instructions or winner
		ctx.font = '16px Inter, sans-serif';
		ctx.fillStyle = '#666';
		if (winner) {
			ctx.font = '32px Orbitron, monospace';
			ctx.fillStyle = winner === 1 ? '#00ff88' : '#0088ff';
			const winnerName = winner === 1 ? p1Name : p2Name;
			ctx.fillText(`${winnerName} Wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		} else if (!gameRunning) {
			ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

	function gameLoop(): void {
		update();
		render();
		animationFrameId = requestAnimationFrame(gameLoop);
	}

	gameLoop();
}
