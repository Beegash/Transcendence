/**
 * AI Player
 * AI opponent that refreshes view once per second and anticipates bounces
 * 
 * Per project requirements:
 * - "The AI can only refresh its view of the game once per second"
 * - "Requiring it to anticipate bounces and other actions"
 * - "You must simulate keyboard input" - AI behaves like human
 * - "It must have the capability to win occasionally"
 * - A* algorithm is NOT permitted
 */

import {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	PADDLE_HEIGHT,
	PADDLE_SPEED,
	BALL_SIZE,
} from './constants.js';
import type { Ball, GameRoom } from './types.js';

export class AIPlayer {
	private targetY: number = CANVAS_HEIGHT / 2;
	private lastUpdateTime: number = 0;

	/**
	 * Called every 1 second (per project requirements)
	 * AI analyzes game state and decides where to move
	 */
	updateView(room: GameRoom): void {
		if (!room.player2 || !room.player2.isAI) return;
		if (room.state.status !== 'playing') return;

		const ball = room.state.ball;

		// Predict where ball will be when it reaches AI paddle (right side)
		this.targetY = this.predictBallPosition(ball);

		// Add some imperfection to make it beatable (human-like behavior)
		const imperfection = (Math.random() - 0.5) * 40; // ±20px error
		this.targetY += imperfection;

		// Clamp target to valid paddle range
		this.targetY = Math.max(
			PADDLE_HEIGHT / 2,
			Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT / 2, this.targetY)
		);

		this.lastUpdateTime = Date.now();
	}

	/**
	 * Predict where ball will intersect with AI paddle's X position
	 * This simulates "anticipating bounces" as required by project
	 */
	private predictBallPosition(ball: Ball): number {
		// If ball is moving away from AI (toward player 1), go to center
		if (ball.vx < 0) {
			return CANVAS_HEIGHT / 2;
		}

		// Calculate time for ball to reach AI paddle
		const aiPaddleX = CANVAS_WIDTH - 20; // AI paddle X position
		const distanceX = aiPaddleX - ball.x;

		if (ball.vx <= 0) return ball.y;

		const timeToReach = distanceX / ball.vx;

		// Predict Y position, accounting for bounces
		let predictedY = ball.y + (ball.vy * timeToReach);

		// Simulate wall bounces
		predictedY = this.simulateBounces(predictedY);

		return predictedY;
	}

	/**
	 * Simulate ball bouncing off top and bottom walls
	 */
	private simulateBounces(y: number): number {
		// Keep bouncing until Y is within bounds
		while (y < 0 || y > CANVAS_HEIGHT - BALL_SIZE) {
			if (y < 0) {
				y = -y; // Bounce off top
			}
			if (y > CANVAS_HEIGHT - BALL_SIZE) {
				y = 2 * (CANVAS_HEIGHT - BALL_SIZE) - y; // Bounce off bottom
			}
		}
		return y;
	}

	/**
	 * Get keyboard-like input based on AI's decision
	 * Called every frame - simulates holding up/down key
	 * Returns paddle movement: -1 (up), 0 (stay), 1 (down)
	 */
	getInput(currentPaddleY: number): number {
		const paddleCenter = currentPaddleY + PADDLE_HEIGHT / 2;
		const difference = this.targetY - paddleCenter;

		// Dead zone - don't micro-adjust (more human-like)
		if (Math.abs(difference) < 10) {
			return 0;
		}

		// Return direction: like pressing up or down key
		return difference > 0 ? 1 : -1;
	}

	/**
	 * Apply AI movement to paddle (simulates keyboard input)
	 * Called every game frame
	 */
	applyMovement(room: GameRoom): void {
		if (!room.player2 || !room.player2.isAI) return;
		if (room.state.status !== 'playing') return;

		const input = this.getInput(room.player2.paddleY);

		// Move paddle like a human pressing keys
		// Limited by same PADDLE_SPEED as human players (fair play)
		let newY = room.player2.paddleY + (input * PADDLE_SPEED);

		// Clamp to bounds
		newY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, newY));

		room.player2.paddleY = newY;
	}
}

// Export singleton
export const aiPlayer = new AIPlayer();
export default aiPlayer;
