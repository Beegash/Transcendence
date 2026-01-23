/**
 * Presence Routes (WebSocket)
 * Handles user online status tracking via persistent WebSocket connection
 * 
 * Users are marked online when they connect and offline when they disconnect.
 * This handles browser close, tab close, and logout scenarios.
 */

import { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import db from '../db/index.js';
import { verifyToken } from '../services/auth.js';

// Track connected users and their WebSocket connections
const connectedUsers = new Map<number, Set<WebSocket>>();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

export default async function presenceRoutes(fastify: FastifyInstance) {
	/**
	 * GET /online-users
	 * Get list of online user IDs (for debugging/admin)
	 */
	fastify.get('/online-users', async (_request, reply) => {
		const onlineUserIds = Array.from(connectedUsers.keys());
		return reply.send({ onlineUsers: onlineUserIds, count: onlineUserIds.length });
	});

	/**
	 * WebSocket /ws - Presence tracking endpoint
	 * Clients should connect here after authentication to maintain online status
	 */
	fastify.get('/ws', { websocket: true }, (connection, _req) => {
		const ws = connection.socket;
		let userId: number | undefined;
		let heartbeatInterval: NodeJS.Timeout | null = null;
		let isAlive = true;

		console.log('[Presence] New connection established');

		// Heartbeat to detect stale connections
		const startHeartbeat = () => {
			heartbeatInterval = setInterval(() => {
				if (!isAlive) {
					console.log(`[Presence] User ${userId} heartbeat timeout, terminating connection`);
					ws.terminate();
					return;
				}
				isAlive = false;
				if (ws.readyState === 1) { // OPEN
					ws.send(JSON.stringify({ type: 'ping' }));
				}
			}, HEARTBEAT_INTERVAL);
		};

		ws.on('message', (rawData: Buffer | ArrayBuffer | Buffer[]) => {
			try {
				const message = JSON.parse(rawData.toString());

				// Handle authentication
				if (message.type === 'auth' && message.token) {
					const payload = verifyToken(message.token);
					if (payload) {
						userId = payload.userId;
						
						// Add to connected users
						if (!connectedUsers.has(userId)) {
							connectedUsers.set(userId, new Set());
						}
						connectedUsers.get(userId)!.add(ws);

						// Update database - mark user as online
						db.prepare('UPDATE users SET is_online = TRUE, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?')
							.run(userId);

						console.log(`[Presence] User ${userId} authenticated and marked online`);

						// Start heartbeat after successful auth
						startHeartbeat();

						// Send confirmation
						ws.send(JSON.stringify({ 
							type: 'authenticated', 
							userId,
							message: 'Online status tracking active'
						}));
					} else {
						ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
						ws.close();
					}
				}

				// Handle pong response (heartbeat)
				if (message.type === 'pong') {
					isAlive = true;
				}

				// Handle explicit logout
				if (message.type === 'logout') {
					console.log(`[Presence] User ${userId} explicitly logged out`);
					handleDisconnect();
					ws.close();
				}

			} catch (error) {
				console.error('[Presence] WebSocket message error:', error);
			}
		});

		const handleDisconnect = () => {
			if (userId) {
				const userConnections = connectedUsers.get(userId);
				if (userConnections) {
					userConnections.delete(ws);
					
					// Only mark offline if no other connections exist
					if (userConnections.size === 0) {
						connectedUsers.delete(userId);
						
						// Update database - mark user as offline
						db.prepare('UPDATE users SET is_online = FALSE, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?')
							.run(userId);
						
						console.log(`[Presence] User ${userId} marked offline (all connections closed)`);
					} else {
						console.log(`[Presence] User ${userId} still has ${userConnections.size} active connection(s)`);
					}
				}
			}

			// Clear heartbeat interval
			if (heartbeatInterval) {
				clearInterval(heartbeatInterval);
				heartbeatInterval = null;
			}
		};

		ws.on('close', () => {
			console.log(`[Presence] Connection closed for user ${userId || 'unknown'}`);
			handleDisconnect();
		});

		ws.on('error', (error: Error) => {
			console.error(`[Presence] WebSocket error for user ${userId || 'unknown'}:`, error.message);
			handleDisconnect();
		});

		// Send initial connection acknowledgment
		ws.send(JSON.stringify({ type: 'connected', message: 'Send auth token to start presence tracking' }));
	});
}

/**
 * Check if a user is currently online
 * Can be used by other modules
 */
export function isUserOnline(userId: number): boolean {
	return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
}

/**
 * Get all online user IDs
 * Can be used by other modules
 */
export function getOnlineUserIds(): number[] {
	return Array.from(connectedUsers.keys());
}

