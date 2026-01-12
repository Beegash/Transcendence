/**
 * Game Routes (WebSocket)
 * Handles real-time game communication
 */

import { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { gameRoomManager } from '../services/gameRoom.js';
import { verifyToken } from '../services/auth.js';

interface WsMessage {
	type: string;
	roomId?: string;
	position?: number;
	token?: string;
}

export default async function gameRoutes(fastify: FastifyInstance) {
	/**
	 * GET /rooms
	 * Get list of available rooms
	 */
	fastify.get('/rooms', async (_request, reply) => {
		const rooms = gameRoomManager.getActiveRooms();
		return reply.send({ rooms });
	});

	/**
	 * WebSocket /ws
	 * Main game WebSocket endpoint
	 */
	fastify.get('/ws', { websocket: true }, (connection, _req) => {
		// Fastify WebSocket gives us a SocketStream, we need the actual WebSocket
		const ws = connection.socket;
		const playerId = Math.random().toString(36).substring(2, 15);
		let currentRoomId: string | null = null;
		let userId: number | undefined;
		let username: string | undefined;

		console.log(`Player ${playerId} connected via WebSocket`);

		ws.on('message', (rawData: Buffer | ArrayBuffer | Buffer[]) => {
			try {
				const message: WsMessage = JSON.parse(rawData.toString());

				// Authenticate if token provided
				if (message.token && !userId) {
					const payload = verifyToken(message.token);
					if (payload) {
						userId = payload.userId;
						username = payload.username;
						console.log(`Player ${playerId} authenticated as ${username}`);
					}
				}

				switch (message.type) {
					case 'create_room': {
						const room = gameRoomManager.createRoom(ws as unknown as WebSocket, playerId, userId, username);
						currentRoomId = room.id;
						ws.send(JSON.stringify({
							type: 'room_created',
							roomId: room.id,
							player: 1,
						}));
						break;
					}

					case 'join_room': {
						if (!message.roomId) {
							ws.send(JSON.stringify({ type: 'error', message: 'Room ID required' }));
							break;
						}

						const room = gameRoomManager.joinRoom(
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

						// Notify player 2
						ws.send(JSON.stringify({
							type: 'room_joined',
							roomId: room.id,
							player: 2,
						}));

						// Notify player 1 that opponent joined
						if (room.player1) {
							room.player1.ws.send(JSON.stringify({
								type: 'opponent_joined',
								username: username || 'Anonymous',
							}));
						}
						break;
					}

					case 'ready': {
						if (currentRoomId) {
							gameRoomManager.setPlayerReady(currentRoomId, playerId);
						}
						break;
					}

					case 'paddle_move': {
						if (currentRoomId && typeof message.position === 'number') {
							gameRoomManager.updatePaddle(currentRoomId, playerId, message.position);
						}
						break;
					}

					case 'ping': {
						ws.send(JSON.stringify({ type: 'pong' }));
						break;
					}

					default:
						console.log(`Unknown message type: ${message.type}`);
				}
			} catch (error) {
				console.error('WebSocket message error:', error);
				ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
			}
		});

		ws.on('close', () => {
			console.log(`Player ${playerId} disconnected`);
			gameRoomManager.handleDisconnect(ws as unknown as WebSocket);
		});

		ws.on('error', (error: Error) => {
			console.error(`WebSocket error for player ${playerId}:`, error);
		});

		// Send welcome message
		ws.send(JSON.stringify({
			type: 'connected',
			playerId,
		}));
	});
}
