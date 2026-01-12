/**
 * Game Room Service
 * Manages game rooms for multiplayer Pong
 */

import { WebSocket } from 'ws';

export interface Player {
	id: string;
	ws: WebSocket;
	userId?: number;
	username?: string;
	paddleY: number;
	ready: boolean;
}

export interface Ball {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface GameState {
	ball: Ball;
	score: { player1: number; player2: number };
	status: 'waiting' | 'ready' | 'playing' | 'finished';
	winner?: 1 | 2;
}

export interface GameRoom {
	id: string;
	player1: Player | null;
	player2: Player | null;
	state: GameState;
	gameLoop: NodeJS.Timeout | null;
	createdAt: Date;
}

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const BALL_SPEED = 5;
const WINNING_SCORE = 5;

class GameRoomManager {
	private rooms: Map<string, GameRoom> = new Map();

	/**
	 * Generate a unique room ID
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
	 * Create a new game room
	 */
	createRoom(ws: WebSocket, playerId: string, userId?: number, username?: string): GameRoom {
		const roomId = this.generateRoomId();

		const player1: Player = {
			id: playerId,
			ws,
			userId,
			username,
			paddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
			ready: false,
		};

		const room: GameRoom = {
			id: roomId,
			player1,
			player2: null,
			state: {
				ball: this.resetBall(),
				score: { player1: 0, player2: 0 },
				status: 'waiting',
			},
			gameLoop: null,
			createdAt: new Date(),
		};

		this.rooms.set(roomId, room);
		console.log(`Room ${roomId} created by player ${playerId}`);
		return room;
	}

	/**
	 * Join an existing room
	 */
	joinRoom(roomId: string, ws: WebSocket, playerId: string, userId?: number, username?: string): GameRoom | null {
		const room = this.rooms.get(roomId);

		if (!room) {
			return null;
		}

		if (room.player2) {
			return null; // Room is full
		}

		room.player2 = {
			id: playerId,
			ws,
			userId,
			username,
			paddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
			ready: false,
		};

		room.state.status = 'ready';
		console.log(`Player ${playerId} joined room ${roomId}`);
		return room;
	}

	/**
	 * Get a room by ID
	 */
	getRoom(roomId: string): GameRoom | null {
		return this.rooms.get(roomId) || null;
	}

	/**
	 * Reset ball to center
	 */
	private resetBall(): Ball {
		const direction = Math.random() > 0.5 ? 1 : -1;
		const angle = (Math.random() - 0.5) * Math.PI / 4; // -45 to 45 degrees
		return {
			x: CANVAS_WIDTH / 2,
			y: CANVAS_HEIGHT / 2,
			vx: BALL_SPEED * direction * Math.cos(angle),
			vy: BALL_SPEED * Math.sin(angle),
		};
	}

	/**
	 * Start the game loop
	 */
	startGame(roomId: string): void {
		const room = this.rooms.get(roomId);
		if (!room || !room.player1 || !room.player2) return;

		room.state.status = 'playing';
		room.state.ball = this.resetBall();

		// Notify both players
		this.broadcast(room, {
			type: 'game_start',
			state: this.getClientState(room),
		});

		// Game loop at 60fps
		room.gameLoop = setInterval(() => {
			this.updateGame(room);
		}, 1000 / 60);
	}

	/**
	 * Update game state
	 */
	private updateGame(room: GameRoom): void {
		if (room.state.status !== 'playing') return;

		const ball = room.state.ball;
		const p1Paddle = room.player1!.paddleY;
		const p2Paddle = room.player2!.paddleY;

		// Move ball
		ball.x += ball.vx;
		ball.y += ball.vy;

		// Top/bottom wall collision
		if (ball.y <= 0 || ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
			ball.vy *= -1;
			ball.y = Math.max(0, Math.min(CANVAS_HEIGHT - BALL_SIZE, ball.y));
		}

		// Paddle collision - Player 1 (left)
		if (
			ball.x <= PADDLE_WIDTH + BALL_SIZE &&
			ball.y + BALL_SIZE >= p1Paddle &&
			ball.y <= p1Paddle + PADDLE_HEIGHT
		) {
			ball.vx = Math.abs(ball.vx); // Bounce right
			ball.x = PADDLE_WIDTH + BALL_SIZE;
			// Add spin based on where ball hit paddle
			const hitPos = (ball.y - p1Paddle) / PADDLE_HEIGHT - 0.5;
			ball.vy += hitPos * 3;
		}

		// Paddle collision - Player 2 (right)
		if (
			ball.x >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
			ball.y + BALL_SIZE >= p2Paddle &&
			ball.y <= p2Paddle + PADDLE_HEIGHT
		) {
			ball.vx = -Math.abs(ball.vx); // Bounce left
			ball.x = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
			const hitPos = (ball.y - p2Paddle) / PADDLE_HEIGHT - 0.5;
			ball.vy += hitPos * 3;
		}

		// Score - Player 2 scores (ball went left)
		if (ball.x < 0) {
			room.state.score.player2++;
			this.checkWinner(room);
			room.state.ball = this.resetBall();
		}

		// Score - Player 1 scores (ball went right)
		if (ball.x > CANVAS_WIDTH) {
			room.state.score.player1++;
			this.checkWinner(room);
			room.state.ball = this.resetBall();
		}

		// Broadcast state to both players
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
	 * End the game
	 */
	private endGame(room: GameRoom, winner: 1 | 2): void {
		room.state.status = 'finished';
		room.state.winner = winner;

		if (room.gameLoop) {
			clearInterval(room.gameLoop);
			room.gameLoop = null;
		}

		this.broadcast(room, {
			type: 'game_over',
			winner,
			state: this.getClientState(room),
		});

		// Clean up room after 30 seconds
		setTimeout(() => {
			this.deleteRoom(room.id);
		}, 30000);
	}

	/**
	 * Update paddle position
	 */
	updatePaddle(roomId: string, playerId: string, position: number): void {
		const room = this.rooms.get(roomId);
		if (!room) return;

		// Clamp position
		position = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, position));

		if (room.player1?.id === playerId) {
			room.player1.paddleY = position;
		} else if (room.player2?.id === playerId) {
			room.player2.paddleY = position;
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

		// If both players ready, start game
		if (room.player1?.ready && room.player2?.ready) {
			this.startGame(roomId);
		}
	}

	/**
	 * Handle player disconnect
	 */
	handleDisconnect(ws: WebSocket): void {
		for (const [roomId, room] of this.rooms) {
			if (room.player1?.ws === ws || room.player2?.ws === ws) {
				// Notify other player
				const otherPlayer = room.player1?.ws === ws ? room.player2 : room.player1;
				if (otherPlayer && otherPlayer.ws.readyState === WebSocket.OPEN) {
					otherPlayer.ws.send(JSON.stringify({
						type: 'opponent_disconnected',
					}));
				}

				// End game loop
				if (room.gameLoop) {
					clearInterval(room.gameLoop);
				}

				// Delete room
				this.deleteRoom(roomId);
				break;
			}
		}
	}

	/**
	 * Delete a room
	 */
	private deleteRoom(roomId: string): void {
		const room = this.rooms.get(roomId);
		if (room?.gameLoop) {
			clearInterval(room.gameLoop);
		}
		this.rooms.delete(roomId);
		console.log(`Room ${roomId} deleted`);
	}

	/**
	 * Get client-safe game state
	 */
	private getClientState(room: GameRoom) {
		return {
			ball: room.state.ball,
			score: room.state.score,
			status: room.state.status,
			winner: room.state.winner,
			paddles: {
				player1: room.player1?.paddleY || 0,
				player2: room.player2?.paddleY || 0,
			},
		};
	}

	/**
	 * Broadcast message to both players
	 */
	private broadcast(room: GameRoom, message: object): void {
		const data = JSON.stringify(message);
		if (room.player1 && room.player1.ws.readyState === WebSocket.OPEN) {
			room.player1.ws.send(data);
		}
		if (room.player2 && room.player2.ws.readyState === WebSocket.OPEN) {
			room.player2.ws.send(data);
		}
	}

	/**
	 * Get all active rooms (for lobby)
	 */
	getActiveRooms(): Array<{ id: string; players: number; status: string }> {
		const rooms: Array<{ id: string; players: number; status: string }> = [];
		for (const [id, room] of this.rooms) {
			rooms.push({
				id,
				players: (room.player1 ? 1 : 0) + (room.player2 ? 1 : 0),
				status: room.state.status,
			});
		}
		return rooms;
	}
}

// Export singleton
export const gameRoomManager = new GameRoomManager();
export default gameRoomManager;
