/**
 * User Routes
 * Handles user profile operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../db/index.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

interface UpdateProfileBody {
	displayName?: string;
	language?: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
	/**
	 * GET /:id
	 * Get user profile by ID
	 */
	fastify.get<{ Params: { id: string } }>(
		'/:id',
		{ preHandler: optionalAuthMiddleware },
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const userId = parseInt(request.params.id, 10);

			if (isNaN(userId)) {
				return reply.status(400).send({ error: 'Invalid user ID' });
			}

			const user = db
				.prepare(
					`SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_online, u.last_seen_at, u.created_at,
                  s.total_games, s.wins, s.losses, s.tournaments_won, s.tournaments_played
           FROM users u
           LEFT JOIN user_stats s ON u.id = s.user_id
           WHERE u.id = ? AND u.is_anonymized = FALSE`
				)
				.get(userId) as Record<string, unknown> | undefined;

			if (!user) {
				return reply.status(404).send({ error: 'User not found' });
			}

			// Check if this is the current user's own profile
			const isOwnProfile = request.user?.userId === userId;

			const response: Record<string, unknown> = {
				id: user.id,
				username: user.username,
				displayName: user.display_name,
				avatarUrl: user.avatar_url,
				isOnline: user.is_online,
				lastSeenAt: user.last_seen_at,
				createdAt: user.created_at,
				stats: {
					totalGames: user.total_games || 0,
					wins: user.wins || 0,
					losses: user.losses || 0,
					winRate:
						user.total_games && (user.total_games as number) > 0
							? Math.round(((user.wins as number) / (user.total_games as number)) * 100)
							: 0,
					tournamentsWon: user.tournaments_won || 0,
					tournamentsPlayed: user.tournaments_played || 0,
				},
			};

			// Include email only for own profile
			if (isOwnProfile) {
				const fullUser = db.prepare('SELECT email, language FROM users WHERE id = ?').get(userId) as {
					email: string;
					language: string;
				} | undefined;
				if (fullUser) {
					response.email = fullUser.email;
					response.language = fullUser.language;
				}
			}

			return reply.send(response);
		}
	);

	/**
	 * PUT /:id
	 * Update user profile
	 */
	fastify.put<{ Params: { id: string }; Body: UpdateProfileBody }>(
		'/:id',
		{ preHandler: authMiddleware },
		async (
			request: FastifyRequest<{ Params: { id: string }; Body: UpdateProfileBody }>,
			reply: FastifyReply
		) => {
			const userId = parseInt(request.params.id, 10);

			if (isNaN(userId)) {
				return reply.status(400).send({ error: 'Invalid user ID' });
			}

			// Users can only update their own profile
			if (request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'You can only update your own profile' });
			}

			const { displayName, language } = request.body;

			// Build update query
			const updates: string[] = [];
			const values: unknown[] = [];

			if (displayName !== undefined) {
				if (displayName.length < 1 || displayName.length > 50) {
					return reply.status(400).send({ error: 'Display name must be between 1 and 50 characters' });
				}
				updates.push('display_name = ?');
				values.push(displayName);
			}

			if (language !== undefined) {
				if (!['en', 'tr', 'fr'].includes(language)) {
					return reply.status(400).send({ error: 'Invalid language. Supported: en, tr, fr' });
				}
				updates.push('language = ?');
				values.push(language);
			}

			if (updates.length === 0) {
				return reply.status(400).send({ error: 'No fields to update' });
			}

			updates.push('updated_at = CURRENT_TIMESTAMP');
			values.push(userId);

			try {
				db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
				return reply.send({ message: 'Profile updated successfully' });
			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({ error: 'Failed to update profile' });
			}
		}
	);

	/**
	 * GET /:id/matches
	 * Get user's match history
	 */
	fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
		'/:id/matches',
		async (
			request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>,
			reply: FastifyReply
		) => {
			const userId = parseInt(request.params.id, 10);
			const limit = Math.min(parseInt(request.query.limit || '10', 10), 50);

			if (isNaN(userId)) {
				return reply.status(400).send({ error: 'Invalid user ID' });
			}

			const matches = db
				.prepare(
					`SELECT m.id, m.player1_id, m.player2_id, m.player1_score, m.player2_score, 
                  m.winner_id, m.match_type, m.ended_at,
                  u1.username as player1_username, u1.display_name as player1_display_name,
                  u2.username as player2_username, u2.display_name as player2_display_name
           FROM matches m
           LEFT JOIN users u1 ON m.player1_id = u1.id
           LEFT JOIN users u2 ON m.player2_id = u2.id
           WHERE (m.player1_id = ? OR m.player2_id = ?) AND m.status = 'completed'
           ORDER BY m.ended_at DESC
           LIMIT ?`
				)
				.all(userId, userId, limit);

			return reply.send({ matches });
		}
	);

	/**
	 * GET /:id/friends
	 * Get user's friend list
	 */
	fastify.get<{ Params: { id: string } }>(
		'/:id/friends',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const userId = parseInt(request.params.id, 10);

			if (isNaN(userId)) {
				return reply.status(400).send({ error: 'Invalid user ID' });
			}

			// Users can only see their own friends list (or we could make it public)
			if (request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'You can only view your own friends list' });
			}

			const friends = db
				.prepare(
					`SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_online, u.last_seen_at, f.status
           FROM friendships f
           JOIN users u ON (f.friend_id = u.id AND f.user_id = ?) 
                        OR (f.user_id = u.id AND f.friend_id = ?)
           WHERE (f.user_id = ? OR f.friend_id = ?) 
             AND f.status = 'accepted'
             AND u.id != ?
             AND u.is_anonymized = FALSE`
				)
				.all(userId, userId, userId, userId, userId);

			return reply.send({ friends });
		}
	);
}
