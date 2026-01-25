import { t } from '../../i18n';
import { CleanupManager } from './utils/cleanup';
import {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	PADDLE_HEIGHT,
	PADDLE_WIDTH,
	BALL_SIZE,
	PADDLE_SPEED,
	BALL_SPEED,
	BALL_SPEED_INCREMENT,
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
import { showGameOverOverlay } from './utils/gameOverOverlay';

export function startLocalGame(
	content: HTMLElement,
	cleanupManager: CleanupManager,
	onBack: () => void
): void {
	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <button id="back-btn" class="btn btn-secondary text-sm">← ${t('common.back')}</button>
        <h2 class="font-game text-xl text-pong-primary">${t('game.localPlay')}</h2>
        <div class="w-20"></div>
      </div>
      
      <div class="card p-2 relative">
        <canvas id="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" class="w-full bg-pong-darker rounded-lg"></canvas>
        <div id="game-over-container"></div>
      </div>
      
      <p class="text-center text-white/60 text-sm mt-4">
        ${t('game.localControls')}
      </p> 
    </div>
  `;

	document.getElementById('back-btn')?.addEventListener('click', onBack);

	initLocalGame(cleanupManager, onBack);
}

function initLocalGame(cleanupManager: CleanupManager, onBack: () => void): void {
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
	let animationFrameId: number | null = null;

	// Key states
	const keys: Record<string, boolean> = {};

	const keyDownHandler = (e: KeyboardEvent) => {
		keys[e.key] = true;
		if (e.key === ' ' && !gameRunning && !winner) {
			gameRunning = true;
		}
		if (e.key === ' ' && winner) {
			// Restart - clear overlay and reset game
			const container = document.getElementById('game-over-container');
			if (container) container.innerHTML = '';
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
	cleanupManager.add(() => {
		window.removeEventListener('keydown', keyDownHandler);
		window.removeEventListener('keyup', keyUpHandler);
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
			const container = document.getElementById('game-over-container');
			if (container) container.innerHTML = '';
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
	cleanupManager.add(() => {
		canvas.removeEventListener('touchstart', touchStartHandler);
		canvas.removeEventListener('touchmove', touchMoveHandler);
		canvas.removeEventListener('touchend', touchEndHandler);
	});

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

			// Apply new velocity
			ballVX = -newSpeed * Math.cos(newAngle);
			ballVY = newSpeed * Math.sin(newAngle);
			ballX = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
		}

		// Scoring
		if (ballX < 0) {
			score2++;
			if (score2 >= WINNING_SCORE) {
				winner = 2;
				showLocalGameOverOverlay();
			} else {
				resetBall('left'); // Ball goes to player 1 (left) who just got scored on
			}
		}
		if (ballX > CANVAS_WIDTH) {
			score1++;
			if (score1 >= WINNING_SCORE) {
				winner = 1;
				showLocalGameOverOverlay();
			} else {
				resetBall('right'); // Ball goes to player 2 (right) who just got scored on
			}
		}
	}

	// Show overlay when someone wins
	function showLocalGameOverOverlay(): void {
		const container = document.getElementById('game-over-container');
		if (!container || !winner) return;

		const overlay = showGameOverOverlay({
			playerNumber: 1, // Always show from Player 1's perspective
			winner: winner,
			isLocalMode: true,
			onRestart: () => {
				container.innerHTML = '';
				score1 = 0;
				score2 = 0;
				winner = null;
				resetBall();
			},
			onExit: onBack // onBack is accessible from initLocalGame closure
		});
		container.appendChild(overlay);
	}

	function render(): void {
		drawBackground(ctx);
		drawCenterLine(ctx);

		// Paddles - Red (P1) and Blue (P2)
		drawPaddle(ctx, 0, paddle1Y, '#C0392B');
		drawPaddle(ctx, CANVAS_WIDTH - PADDLE_WIDTH, paddle2Y, '#3498DB');

		// Ball
		drawBall(ctx, ballX, ballY);

		// Score
		drawScore(ctx, score1, score2, {
			score1X: CANVAS_WIDTH / 4,
			score2X: (CANVAS_WIDTH / 4) * 3
		});

		// Pause message only (winner is shown in overlay)
		if (!gameRunning && !winner) {
			drawPauseMessage(ctx, t('game.pressSpace'));
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
