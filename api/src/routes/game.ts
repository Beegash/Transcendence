/**
 * Game Routes (WebSocket)
 * Handles real-time game communication for multiplayer and AI
 */

import { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { roomManager } from '../game/index.js';
import { verifyToken } from '../services/auth.js';

interface WsMessage {
	type: string;
	roomId?: string;
	position?: number;
	token?: string;
}

export default async function gameRoutes(fastify: FastifyInstance) {
	/**
	 * GET /rooms - List active rooms
	 */
	fastify.get('/rooms', async (_request, reply) => {
		const rooms = roomManager.getActiveRooms();
		return reply.send({ rooms });
	});

	/**
	 * WebSocket /ws - Main game endpoint
	 */
	fastify.get('/ws', { websocket: true }, (connection, _req) => {
		const ws = connection.socket;
		const playerId = Math.random().toString(36).substring(2, 15);
		let currentRoomId: string | null = null;
		let userId: number | undefined;
		let username: string | undefined;

		console.log(`Player ${playerId} connected`);

		ws.on('message', (rawData: Buffer | ArrayBuffer | Buffer[]) => {
			try {
				const message: WsMessage = JSON.parse(rawData.toString());

				// Auth
				if (message.token && !userId) {
					const payload = verifyToken(message.token);
					if (payload) {
						userId = payload.userId;
						username = payload.username;
					}
				}

				switch (message.type) {
					// Create room for human vs human
					case 'create_room': {
						const room = roomManager.createRoom(ws as unknown as WebSocket, playerId, userId, username);
						currentRoomId = room.id;
						ws.send(JSON.stringify({
							type: 'room_created',
							roomId: room.id,
							player: 1,
						}));
						break;
					}

					// Create room for human vs AI
					case 'create_ai_room': {
						const room = roomManager.createAIRoom(ws as unknown as WebSocket, playerId, userId, username);
						currentRoomId = room.id;
						ws.send(JSON.stringify({
							type: 'ai_room_created',
							roomId: room.id,
							player: 1,
						}));
						break;
					}

					// Join existing room
					case 'join_room': {
						if (!message.roomId) {
							ws.send(JSON.stringify({ type: 'error', message: 'Room ID required' }));
							break;
						}

						const room = roomManager.joinRoom(
							message.roomId,
							ws as unknown as WebSocket,
							playerId,
							userId,
							username
						);

						if (!room) {
							ws.send(JSON.stringify({ type: 'error', message: 'Room not found or full' }));
							break;
						}

						currentRoomId = room.id;
						ws.send(JSON.stringify({
							type: 'room_joined',
							roomId: room.id,
							player: 2,
						}));

						if (room.player1) {
							room.player1.ws?.send(JSON.stringify({
								type: 'opponent_joined',
								username: username || 'Anonymous',
							}));
						}
						break;
					}

					case 'ready': {
						if (currentRoomId) {
							roomManager.setPlayerReady(currentRoomId, playerId);
						}
						break;
					}

					case 'paddle_move': {
						if (currentRoomId && typeof message.position === 'number') {
							roomManager.updatePaddle(currentRoomId, playerId, message.position);
						}
						break;
					}

					case 'ping': {
						ws.send(JSON.stringify({ type: 'pong' }));
						break;
					}
				}
			} catch (error) {
				console.error('WebSocket error:', error);
				ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
			}
		});

		ws.on('close', () => {
			console.log(`Player ${playerId} disconnected`);
			roomManager.handleDisconnect(ws as unknown as WebSocket);
		});

		ws.on('error', (error: Error) => {
			console.error(`WS error:`, error);
		});

		ws.send(JSON.stringify({ type: 'connected', playerId }));
	});
}
