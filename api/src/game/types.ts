/**
 * Game Types
 * Shared interfaces for Pong game
 */

import { WebSocket } from 'ws';

export interface Ball {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface Player {
	id: string;
	ws: WebSocket | null; // null for AI player
	userId?: number;
	username?: string;
	paddleY: number;
	ready: boolean;
	isAI: boolean;
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
	aiLoop: NodeJS.Timeout | null; // AI refresh timer
	createdAt: Date;
	isVsAI: boolean;
}

export interface ClientGameState {
	ball: Ball;
	score: { player1: number; player2: number };
	status: string;
	winner?: 1 | 2;
	paddles: { player1: number; player2: number };
}
