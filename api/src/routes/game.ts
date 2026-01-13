/**
 * Game Routes (WebSocket)
 * Handles real-time game communication for multiplayer and AI
 */

import { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { roomManager } from '../game/index.js';
import { verifyToken } from '../services/auth.js';
import * as tournamentService from '../services/tournament.js';
import { tournamentDispatcher, TOURNAMENT_UPDATED } from '../services/tournamentEvents.js';

interface WsMessage {
	type: string;
	roomId?: string;
	position?: number;
	token?: string;
	tournamentId?: number;
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

						// Send room_joined to Player 2 with host info
						ws.send(JSON.stringify({
							type: 'room_joined',
							roomId: room.id,
							player: 2,
							hostUsername: room.player1?.username || 'Anonymous',
						}));

						// Notify Player 1 that opponent joined
						if (room.player1?.ws) {
							room.player1.ws.send(JSON.stringify({
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

					// Join tournament match (online)
					case 'join_tournament_match': {
						if (!message.roomId) { // Here roomId will be matchId
							ws.send(JSON.stringify({ type: 'error', message: 'Match ID required' }));
							break;
						}

						if (!userId) {
							ws.send(JSON.stringify({ type: 'error', message: 'Authentication required for tournament matches' }));
							break;
						}

						const matchId = parseInt(message.roomId);
						const match = tournamentService.getMatchById(matchId);

						if (!match) {
							ws.send(JSON.stringify({ type: 'error', message: 'Match not found' }));
							break;
						}

						// Verify user is part of this match
						let mySlot: 1 | 2 | null = null;
						if (match.player1_id === userId) mySlot = 1;
						else if (match.player2_id === userId) mySlot = 2;

						if (!mySlot) {
							ws.send(JSON.stringify({ type: 'error', message: 'You are not a participant in this match' }));
							break;
						}

						const tournamentRoomId = `tournament_${matchId}`;
						let room = roomManager.getRoom(tournamentRoomId);

						if (!room) {
							// Create room with our tournament-specific ID and explicit slot
							room = roomManager.createRoom(ws as unknown as WebSocket, playerId, userId, username, tournamentRoomId, mySlot);

							currentRoomId = tournamentRoomId;
							ws.send(JSON.stringify({
								type: 'room_created',
								roomId: tournamentRoomId,
								player: mySlot,
							}));
						} else {
							// Join existing room with explicit slot
							const joinedRoom = roomManager.joinRoom(
								tournamentRoomId,
								ws as unknown as WebSocket,
								playerId,
								userId,
								username,
								mySlot
							);

							if (!joinedRoom) {
								const existingRoom = roomManager.getRoom(tournamentRoomId);
								const isAlreadyIn = (mySlot === 1 && existingRoom?.player1?.userId === userId) || (mySlot === 2 && existingRoom?.player2?.userId === userId);
								ws.send(JSON.stringify({ type: 'error', message: isAlreadyIn ? 'You already joined' : 'Match room full or slot taken' }));
								break;
							}

							currentRoomId = tournamentRoomId;

							// Send room_joined to the joiner
							ws.send(JSON.stringify({
								type: 'room_joined',
								roomId: tournamentRoomId,
								player: mySlot,
								hostUsername: mySlot === 2 ? joinedRoom.player1?.username : joinedRoom.player2?.username,
							}));

							// Notify the other player
							const otherPlayer = mySlot === 2 ? joinedRoom.player1 : joinedRoom.player2;
							if (otherPlayer?.ws) {
								otherPlayer.ws.send(JSON.stringify({
									type: 'opponent_joined',
									username: username || 'Anonymous',
								}));
							}
						}
						break;
					}

					case 'subscribe_tournament': {
						if (!message.tournamentId) break;

						const tId = message.tournamentId;
						console.log(`Player ${playerId} subscribed to tournament ${tId}`);

						const updateHandler = (data: { tournamentId: number }) => {
							if (data.tournamentId === tId) {
								if (ws.readyState === 1) { // OPEN
									ws.send(JSON.stringify({
										type: 'tournament_update',
										tournamentId: tId
									}));
								}
							}
						};

						// Clean up previous registration for this socket if any
						if ((ws as any)._tournamentUpdateHandler) {
							tournamentDispatcher.off(TOURNAMENT_UPDATED, (ws as any)._tournamentUpdateHandler);
						}

						tournamentDispatcher.on(TOURNAMENT_UPDATED, updateHandler);
						(ws as any)._tournamentUpdateHandler = updateHandler;
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
			if ((ws as any)._tournamentUpdateHandler) {
				tournamentDispatcher.off(TOURNAMENT_UPDATED, (ws as any)._tournamentUpdateHandler);
			}
			roomManager.handleDisconnect(ws as unknown as WebSocket);
		});

		ws.on('error', (error: Error) => {
			console.error(`WS error:`, error);
		});

		ws.send(JSON.stringify({ type: 'connected', playerId }));
	});
}
