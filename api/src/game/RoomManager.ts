/**
 * Room Manager
 * Manages game rooms for multiplayer and AI games
 */

import { WebSocket } from 'ws';
import {
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	PADDLE_HEIGHT,
	PADDLE_WIDTH,
	BALL_SIZE,
	BALL_SPEED,
	BALL_SPEED_INCREMENT,
	BALL_MAX_SPEED,
	WINNING_SCORE,
	AI_REFRESH_INTERVAL,
} from './constants.js';
import type { Ball, Player, GameRoom, GameState, ClientGameState } from './types.js';
import { aiPlayer } from './AIPlayer.js';
import { recordMatch } from '../services/stats.js';

class RoomManager {
	private rooms: Map<string, GameRoom> = new Map();

	/**
	 * Generate unique room ID
	 */
	private generateRoomId(): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let id = '';
		for (let i = 0; i < 6; i++) {
			id += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return id;
	}

	/**
	 * Reset ball to center
	 * @param direction Optional direction: 'left' sends ball to player1, 'right' to player2
	 */
	private resetBall(direction?: 'left' | 'right'): Ball {
		// First serve: random direction. After scoring: ball goes to loser
		let directionX: number;
		if (direction === 'left') {
			directionX = -1;  // Ball goes left (to player1 who just got scored on)
		} else if (direction === 'right') {
			directionX = 1;   // Ball goes right (to player2 who just got scored on)
		} else {
			directionX = Math.random() > 0.5 ? 1 : -1;  // Random for first serve
		}
		const angle = (Math.random() - 0.5) * Math.PI / 4;
		return {
			x: CANVAS_WIDTH / 2,
			y: CANVAS_HEIGHT / 2,
			vx: BALL_SPEED * directionX * Math.cos(angle),
			vy: BALL_SPEED * Math.sin(angle),
		};
	}

	/**
	 * Create new room for human vs human
	 */
	createRoom(ws: WebSocket | null, playerId: string, userId?: number, username?: string, customRoomId?: string, forceSlot?: 1 | 2, invitedUserId?: number): GameRoom {
		const roomId = customRoomId || this.generateRoomId();

		const player: Player = {
			id: playerId,
			ws,
			userId,
			username,
			paddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
			ready: false,
			isAI: false,
		};

		const room: GameRoom = {
			id: roomId,
			player1: forceSlot === 2 ? null : player,
			player2: forceSlot === 2 ? player : null,
			state: {
				ball: this.resetBall(),
				score: { player1: 0, player2: 0 },
				status: 'waiting',
			},
			gameLoop: null,
			aiLoop: null,
			createdAt: new Date(),
			isVsAI: false,
			invitedUserId,
		};

		this.rooms.set(roomId, room);
		console.log(`Room ${roomId} created (Slot: ${forceSlot || 1})${invitedUserId ? ` [Private: invited user ${invitedUserId}]` : ''}`);
		return room;
	}

	/**
	 * Create room for human vs AI
	 */
	createAIRoom(ws: WebSocket, playerId: string, userId?: number, username?: string): GameRoom {
		const roomId = this.generateRoomId();

		const player1: Player = {
			id: playerId,
			ws,
			userId,
			username,
			paddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
			ready: false,
			isAI: false,
		};

		const player2: Player = {
			id: 'AI',
			ws: null, // AI doesn't need WebSocket
			username: 'AI Opponent',
			paddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
			ready: true, // AI is always ready
			isAI: true,
		};

		const room: GameRoom = {
			id: roomId,
			player1,
			player2,
			state: {
				ball: this.resetBall(),
				score: { player1: 0, player2: 0 },
				status: 'ready',
			},
			gameLoop: null,
			aiLoop: null,
			createdAt: new Date(),
			isVsAI: true,
		};

		this.rooms.set(roomId, room);
		console.log(`AI Room ${roomId} created`);
		return room;
	}

	/**
	 * Join existing room
	 */
	joinRoom(roomId: string, ws: WebSocket, playerId: string, userId?: number, username?: string, forceSlot?: 1 | 2): GameRoom | null {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		// Check if this is a private invite room
		if (room.invitedUserId) {
			// Only the invited user can join
			if (!userId || userId !== room.invitedUserId) {
				console.log(`User ${userId} tried to join private room ${roomId} but is not the invited user (${room.invitedUserId})`);
				return null;
			}
		}

		// Prevent same user from joining as both players (self-lobby join bug)
		if (userId) {
			if (room.player1?.userId === userId || room.player2?.userId === userId) {
				console.log(`User ${userId} tried to join room ${roomId} but is already in the room - self-join prevented`);
				return null;
			}
		}

		const player: Player = {
			id: playerId,
			ws,
			userId,
			username,
			paddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
			ready: false,
			isAI: false,
		};

		if (forceSlot === 1) {
			if (room.player1) return null;
			room.player1 = player;
		} else if (forceSlot === 2) {
			if (room.player2) return null;
			room.player2 = player;
		} else {
			// Auto assign
			if (!room.player1) {
				room.player1 = player;
			} else if (!room.player2) {
				room.player2 = player;
			} else {
				return null;
			}
		}

		if (room.player1 && room.player2) {
			room.state.status = 'ready';
		}

		console.log(`Player ${playerId} joined room ${roomId} as slot ${room.player1?.id === playerId ? 1 : 2}`);
		return room;
	}

	/**
	 * Get room by ID
	 */
	getRoom(roomId: string): GameRoom | null {
		return this.rooms.get(roomId) || null;
	}

	/**
	 * Start game
	 */
	startGame(roomId: string): void {
		const room = this.rooms.get(roomId);
		if (!room || !room.player1 || !room.player2) return;

		room.state.status = 'playing';
		room.state.ball = this.resetBall();
		room.state.ballPaused = true;

		this.broadcast(room, {
			type: 'game_start',
			state: this.getClientState(room),
		});

		// Game loop at 60fps
		room.gameLoop = setInterval(() => {
			this.updateGame(room);
		}, 1000 / 60);

		// If vs AI, start AI refresh loop (1 second interval per project requirements)
		if (room.isVsAI) {
			room.aiLoop = setInterval(() => {
				aiPlayer.updateView(room);
			}, AI_REFRESH_INTERVAL);
		}
	}

	/**
	 * Update game state
	 */
	private updateGame(room: GameRoom): void {
		if (room.state.status !== 'playing') return;
		if (!room.player1 || !room.player2) return;

		// Apply AI movement every frame (simulates keyboard holding)
		if (room.isVsAI) {
			aiPlayer.applyMovement(room);
		}

		this.updateBall(room);

		// Broadcast state
		this.broadcast(room, {
			type: 'game_state',
			state: this.getClientState(room),
		});
	}

	/**
	 * Update ball position and handle collisions
	 */
	private updateBall(room: GameRoom): void {
		const ball = room.state.ball;

		// Don't move ball if paused
		if (room.state.ballPaused) {
			return;
		}

		// Ensure players exist before accessing paddles
		if (!room.player1 || !room.player2) return;

		const p1Paddle = room.player1.paddleY;
		const p2Paddle = room.player2.paddleY;

		// Move ball
		ball.x += ball.vx;
		ball.y += ball.vy;

		// Wall collision
		if (ball.y <= 0 || ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
			ball.vy *= -1;
			ball.y = Math.max(0, Math.min(CANVAS_HEIGHT - BALL_SIZE, ball.y));
		}

		// Paddle 1 collision (left)
		if (
			ball.x <= PADDLE_WIDTH + BALL_SIZE &&
			ball.y + BALL_SIZE >= p1Paddle &&
			ball.y <= p1Paddle + PADDLE_HEIGHT
		) {
			// Calculate current speed
			const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

			// Calculate hit position for angle adjustment (-0.5 to 0.5)
			const hitPos = (ball.y - p1Paddle) / PADDLE_HEIGHT - 0.5;

			// Always increase speed - NO CAP!
			const newSpeed = currentSpeed + BALL_SPEED_INCREMENT;

			// Preserve current angle and add subtle variation based on hit position
			const currentAngle = Math.atan2(ball.vy, Math.abs(ball.vx));
			const angleAdjustment = hitPos * 0.6;
			const newAngle = currentAngle + angleAdjustment;

			// Apply new velocity (going right)
			ball.vx = newSpeed * Math.cos(newAngle);
			ball.vy = newSpeed * Math.sin(newAngle);
			ball.x = PADDLE_WIDTH + BALL_SIZE;
		}

		// Paddle 2 collision (right)
		if (
			ball.x >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
			ball.y + BALL_SIZE >= p2Paddle &&
			ball.y <= p2Paddle + PADDLE_HEIGHT
		) {
			// Calculate current speed
			const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

			// Calculate hit position for angle adjustment (-0.5 to 0.5)
			const hitPos = (ball.y - p2Paddle) / PADDLE_HEIGHT - 0.5;

			// Always increase speed - NO CAP!
			const newSpeed = currentSpeed + BALL_SPEED_INCREMENT;

			// Preserve current angle and add subtle variation based on hit position
			const currentAngle = Math.atan2(ball.vy, Math.abs(ball.vx));
			const angleAdjustment = hitPos * 0.6;
			const newAngle = currentAngle + angleAdjustment;

			// Apply new velocity (going left)
			ball.vx = -newSpeed * Math.cos(newAngle);
			ball.vy = newSpeed * Math.sin(newAngle);
			ball.x = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
		}


		// Scoring
		if (ball.x < 0) {
			room.state.score.player2++;
			this.checkWinner(room);
			if (room.state.status !== 'finished') {
				room.state.ball = this.resetBall('left');  // Ball goes to player1 (left) who just got scored on
				room.state.ballPaused = true; // Pause until player presses space/touch
			}
		}
		if (ball.x > CANVAS_WIDTH) {
			room.state.score.player1++;
			this.checkWinner(room);
			if (room.state.status !== 'finished') {
				room.state.ball = this.resetBall('right');  // Ball goes to player2 (right) who just got scored on
				room.state.ballPaused = true; // Pause until player presses space/touch
			}
		}

		// Broadcast state
		this.broadcast(room, {
			type: 'game_state',
			state: this.getClientState(room),
		});
	}

	/**
	 * Check for winner
	 */
	private checkWinner(room: GameRoom): void {
		if (room.state.score.player1 >= WINNING_SCORE) {
			this.endGame(room, 1);
		} else if (room.state.score.player2 >= WINNING_SCORE) {
			this.endGame(room, 2);
		}
	}

	/**
	 * End game
	 */
	private endGame(room: GameRoom, winner: 1 | 2): void {
		room.state.status = 'finished';
		room.state.winner = winner;

		if (room.gameLoop) {
			clearInterval(room.gameLoop);
			room.gameLoop = null;
		}
		if (room.aiLoop) {
			clearInterval(room.aiLoop);
			room.aiLoop = null;
		}

		// Record match result in database
		try {
			const player1Id = room.player1?.userId || null;
			const player2Id = room.player2?.userId || null;
			const player1Score = room.state.score.player1;
			const player2Score = room.state.score.player2;
			const player1Alias = room.player1?.username;
			const player2Alias = room.player2?.username || (room.isVsAI ? 'AI' : undefined);

			// Determine match type
			const matchType = room.isVsAI ? 'ai' : 'casual';

			// Only record if at least one player is a real user
			if (player1Id || player2Id) {
				recordMatch(
					player1Id,
					player2Id,
					player1Score,
					player2Score,
					matchType,
					player1Alias,
					player2Alias
				);
				console.log(`Match recorded: P1(${player1Id}) ${player1Score} - ${player2Score} P2(${player2Id}) [${matchType}]`);
			}
		} catch (error) {
			console.error('Failed to record match:', error);
		}

		this.broadcast(room, {
			type: 'game_over',
			winner,
			state: this.getClientState(room),
		});

		// Cleanup after 30s
		setTimeout(() => this.deleteRoom(room.id), 30000);
	}

	/**
	 * Update paddle position
	 */
	updatePaddle(roomId: string, playerId: string, position: number): void {
		const room = this.rooms.get(roomId);
		if (!room) return;

		position = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, position));

		if (room.player1?.id === playerId) {
			room.player1.paddleY = position;
		} else if (room.player2?.id === playerId && !room.player2.isAI) {
			room.player2.paddleY = position;
		}
	}

	/**
	 * Resume ball after pause (called when player presses space/touch after scoring)
	 */
	resumeBall(roomId: string): void {
		const room = this.rooms.get(roomId);
		if (!room) return;
		if (room.state.status !== 'playing') return;

		if (room.state.ballPaused) {
			room.state.ballPaused = false;
		}
	}

	/**
	 * Set player ready
	 */
	setPlayerReady(roomId: string, playerId: string): void {
		const room = this.rooms.get(roomId);
		if (!room) return;

		if (room.player1?.id === playerId) {
			room.player1.ready = true;
		} else if (room.player2?.id === playerId) {
			room.player2.ready = true;
		}

		// Both ready → start
		if (room.player1?.ready && room.player2?.ready) {
			this.startGame(roomId);
		}
	}

	/**
	 * Handle disconnect
	 */
	handleDisconnect(ws: WebSocket): void {
		for (const [roomId, room] of this.rooms) {
			if (room.player1?.ws === ws || room.player2?.ws === ws) {
				const disconnectedPlayer = room.player1?.ws === ws ? 1 : 2;
				const otherPlayer = disconnectedPlayer === 1 ? room.player2 : room.player1;

				// If game is in progress, award win to remaining player
				if (room.state.status === 'playing') {
					const winner = disconnectedPlayer === 1 ? 2 : 1;
					console.log(`Player ${disconnectedPlayer} disconnected during game. Awarding forfeit win to player ${winner}`);

					// Stop game loops
					if (room.gameLoop) {
						clearInterval(room.gameLoop);
						room.gameLoop = null;
					}
					if (room.aiLoop) {
						clearInterval(room.aiLoop);
						room.aiLoop = null;
					}

					// Set forfeit score: winner gets WINNING_SCORE, loser gets 0
					if (winner === 1) {
						room.state.score.player1 = WINNING_SCORE;
						room.state.score.player2 = 0;
					} else {
						room.state.score.player1 = 0;
						room.state.score.player2 = WINNING_SCORE;
					}

					// Set game as finished with winner
					room.state.status = 'finished';
					room.state.winner = winner as 1 | 2;

					// Record match result (disconnecting player forfeits - 5-0)
					try {
						const player1Id = room.player1?.userId || null;
						const player2Id = room.player2?.userId || null;
						const player1Score = room.state.score.player1;
						const player2Score = room.state.score.player2;
						const player1Alias = room.player1?.username;
						const player2Alias = room.player2?.username || (room.isVsAI ? 'AI' : undefined);
						const matchType = room.isVsAI ? 'ai' : 'casual';

						// Only record if at least one player is a real user
						if (player1Id || player2Id) {
							recordMatch(
								player1Id,
								player2Id,
								player1Score,
								player2Score,
								matchType,
								player1Alias,
								player2Alias
							);
							console.log(`Match recorded (forfeit): P1(${player1Id}) ${player1Score} - ${player2Score} P2(${player2Id}) [${matchType}]`);
						}
					} catch (error) {
						console.error('Failed to record match on disconnect:', error);
					}

					// Notify remaining player they won
					if (otherPlayer && otherPlayer.ws && otherPlayer.ws.readyState === WebSocket.OPEN) {
						otherPlayer.ws.send(JSON.stringify({
							type: 'game_over',
							winner: winner,
							reason: 'opponent_disconnected',
							state: this.getClientState(room),
						}));
					}

					// Clean up room after a short delay
					setTimeout(() => this.deleteRoom(roomId), 5000);
				} else {
					// Game not in progress - just notify and clean up
					if (otherPlayer && otherPlayer.ws && otherPlayer.ws.readyState === WebSocket.OPEN) {
						otherPlayer.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
					}

					if (room.gameLoop) clearInterval(room.gameLoop);
					if (room.aiLoop) clearInterval(room.aiLoop);
					this.deleteRoom(roomId);
				}
				break;
			}
		}
	}

	/**
	 * Delete room
	 */
	private deleteRoom(roomId: string): void {
		const room = this.rooms.get(roomId);
		if (room?.gameLoop) clearInterval(room.gameLoop);
		if (room?.aiLoop) clearInterval(room.aiLoop);
		this.rooms.delete(roomId);
		console.log(`Room ${roomId} deleted`);
	}

	/**
	 * Get client-safe state
	 */
	private getClientState(room: GameRoom): ClientGameState {
		return {
			ball: room.state.ball,
			score: room.state.score,
			status: room.state.status,
			winner: room.state.winner,
			paddles: {
				player1: room.player1?.paddleY || 0,
				player2: room.player2?.paddleY || 0,
			},
			ballPaused: room.state.ballPaused,
		};
	}

	/**
	 * Broadcast to players
	 */
	private broadcast(room: GameRoom, message: object): void {
		const data = JSON.stringify(message);
		if (room.player1 && room.player1.ws && room.player1.ws.readyState === WebSocket.OPEN) {
			room.player1.ws.send(data);
		}
		// Don't send to AI player (no WebSocket)
		if (room.player2 && room.player2.ws && !room.player2.isAI && room.player2.ws.readyState === WebSocket.OPEN) {
			room.player2.ws.send(data);
		}
	}

	/**
	 * Get active rooms (excludes private invite rooms and tournament rooms)
	 */
	getActiveRooms(): Array<{ id: string; players: number; status: string; isVsAI: boolean }> {
		const result: Array<{ id: string; players: number; status: string; isVsAI: boolean }> = [];
		for (const [id, room] of this.rooms) {
			// Skip private invite rooms (they have invitedUserId or start with 'invite_')
			if (room.invitedUserId || id.startsWith('invite_') || id.startsWith('tournament_')) {
				continue;
			}
			result.push({
				id,
				players: (room.player1 ? 1 : 0) + (room.player2 && !room.player2.isAI ? 1 : 0),
				status: room.state.status,
				isVsAI: room.isVsAI,
			});
		}
		return result;
	}
}

export const roomManager = new RoomManager();
export default roomManager;
