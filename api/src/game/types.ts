// Game Types - Shared interfaces for Pong game components

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
	ballPaused?: boolean; // Ball is paused after each point, waiting for player input
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
	invitedUserId?: number; // For private invite rooms - only this user can join

	isTournament: boolean;
	tournamentId?: number;
	tournamentMatchId?: number;
}

export interface ClientGameState {
	ball: Ball;
	score: { player1: number; player2: number };
	status: string;
	winner?: 1 | 2;
	paddles: { player1: number; player2: number };
	ballPaused?: boolean;
}
