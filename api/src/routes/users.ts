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
	username?: string;
}

interface Notification {
	id: number;
	type: 'friend_request' | 'game_invite' | 'system';
	senderId: number | null;
	status: 'unread' | 'read';
	data: string | null;
	createdAt: string;
	senderName?: string;
	senderAvatar?: string;
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

			const { username } = request.body;
			if (username !== undefined) {
				// Validate username format
				if (username.length < 3 || username.length > 20) {
					return reply.status(400).send({ error: 'Username must be between 3 and 20 characters' });
				}
				if (!/^[a-zA-Z0-9_]+$/.test(username)) {
					return reply.status(400).send({ error: 'Username can only contain letters, numbers, and underscores' });
				}

				// Check if username already exists
				const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username.toLowerCase(), userId) as { id: number } | undefined;
				if (existingUser) {
					return reply.status(409).send({ error: 'Username already taken' });
				}

				updates.push('username = ?');
				values.push(username.toLowerCase());

				// Also update display_name to match username to avoid confusion in UI
				// (since Navbar and Profile prefer display_name)
				updates.push('display_name = ?');
				values.push(username);
			}

			if (language !== undefined) {
				if (!['en', 'tr', 'fr', 'de'].includes(language)) {
					return reply.status(400).send({ error: 'Invalid language. Supported: en, tr, fr, de' });
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

	/**
	 * GET /:id/friends/requests
	 * Get pending friend requests (received)
	 */
	fastify.get<{ Params: { id: string } }>(
		'/:id/friends/requests',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const userId = parseInt(request.params.id, 10);

			if (isNaN(userId) || request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'Unauthorized' });
			}

			const requests = db
				.prepare(
					`SELECT f.id, f.user_id as senderId, f.created_at,
					 u.username, u.display_name, u.avatar_url, u.is_online
					 FROM friendships f
					 JOIN users u ON f.user_id = u.id
					 WHERE f.friend_id = ? AND f.status = 'pending'
					 ORDER BY f.created_at DESC`
				)
				.all(userId);

			return reply.send({ requests });
		}
	);

	/**
	 * POST /:id/friends
	 * Send friend request
	 */
	fastify.post<{ Params: { id: string }; Body: { friendId: number } }>(
		'/:id/friends',
		{ preHandler: authMiddleware },
		async (
			request: FastifyRequest<{ Params: { id: string }; Body: { friendId: number } }>,
			reply: FastifyReply
		) => {
			const userId = parseInt(request.params.id, 10);
			const { friendId } = request.body;

			if (isNaN(userId) || request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'Unauthorized' });
			}

			if (userId === friendId) {
				return reply.status(400).send({ error: 'Cannot add yourself as friend' });
			}

			// Check if friend exists
			const friend = db.prepare('SELECT id FROM users WHERE id = ? AND is_anonymized = FALSE').get(friendId);
			if (!friend) {
				return reply.status(404).send({ error: 'User not found' });
			}

			// Check existing friendship
			const existing = db
				.prepare('SELECT id, status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)')
				.get(userId, friendId, friendId, userId) as { id: number; status: string } | undefined;

			if (existing) {
				if (existing.status === 'accepted') {
					return reply.status(400).send({ error: 'Already friends' });
				}
				if (existing.status === 'pending') {
					return reply.status(400).send({ error: 'Friend request already pending' });
				}
				if (existing.status === 'blocked') {
					return reply.status(400).send({ error: 'Cannot send request' });
				}
			}

			try {
				db.prepare('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)').run(userId, friendId, 'pending');

				// Create notification for the friend
				db.prepare(
					'INSERT INTO notifications (user_id, type, sender_id, status) VALUES (?, ?, ?, ?)'
				).run(friendId, 'friend_request', userId, 'unread');

				return reply.status(201).send({ message: 'Friend request sent' });
			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({ error: 'Failed to send friend request' });
			}
		}
	);

	/**
	 * PUT /:id/friends/:friendId
	 * Accept or reject friend request
	 */
	fastify.put<{ Params: { id: string; friendId: string }; Body: { action: 'accept' | 'reject' } }>(
		'/:id/friends/:friendId',
		{ preHandler: authMiddleware },
		async (
			request: FastifyRequest<{ Params: { id: string; friendId: string }; Body: { action: 'accept' | 'reject' } }>,
			reply: FastifyReply
		) => {
			const userId = parseInt(request.params.id, 10);
			const friendId = parseInt(request.params.friendId, 10);
			const { action } = request.body;

			if (isNaN(userId) || request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'Unauthorized' });
			}

			if (!['accept', 'reject'].includes(action)) {
				return reply.status(400).send({ error: 'Invalid action. Use accept or reject' });
			}

			// Find the pending request (where current user is the recipient)
			const friendship = db
				.prepare('SELECT id FROM friendships WHERE user_id = ? AND friend_id = ? AND status = ?')
				.get(friendId, userId, 'pending') as { id: number } | undefined;

			if (!friendship) {
				return reply.status(404).send({ error: 'Friend request not found' });
			}

			try {
				if (action === 'accept') {
					db.prepare('UPDATE friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('accepted', friendship.id);

					// Notify the person who sent the request
					db.prepare(
						'INSERT INTO notifications (user_id, type, sender_id, status) VALUES (?, ?, ?, ?)'
					).run(friendId, 'system', userId, 'unread'); // Using system/accepted type? Let's use 'system' for now or add 'accepted' type

					return reply.send({ message: 'Friend request accepted' });
				} else {
					db.prepare('DELETE FROM friendships WHERE id = ?').run(friendship.id);
					return reply.send({ message: 'Friend request rejected' });
				}
			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({ error: 'Failed to process request' });
			}
		}
	);

	/**
	 * DELETE /:id/friends/:friendId
	 * Remove friend
	 */
	fastify.delete<{ Params: { id: string; friendId: string } }>(
		'/:id/friends/:friendId',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { id: string; friendId: string } }>, reply: FastifyReply) => {
			const userId = parseInt(request.params.id, 10);
			const friendId = parseInt(request.params.friendId, 10);

			if (isNaN(userId) || request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'Unauthorized' });
			}

			try {
				const result = db
					.prepare('DELETE FROM friendships WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?')
					.run(userId, friendId, friendId, userId, 'accepted');

				if (result.changes === 0) {
					return reply.status(404).send({ error: 'Friendship not found' });
				}

				return reply.send({ message: 'Friend removed' });
			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({ error: 'Failed to remove friend' });
			}
		}
	);

	/**
	 * POST /:id/avatar
	 * Upload avatar image
	 */
	fastify.post<{ Params: { id: string } }>(
		'/:id/avatar',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const userId = parseInt(request.params.id, 10);

			if (isNaN(userId) || request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'Unauthorized' });
			}

			try {
				const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
				const data = await request.file({ limits: { fileSize: MAX_FILE_SIZE } });
				if (!data) {
					return reply.status(400).send({ error: 'No file uploaded' });
				}

				// Validate file type (accept both image/jpeg and image/jpg MIME types)
				const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
				if (!allowedTypes.includes(data.mimetype)) {
					return reply.status(400).send({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' });
				}

				// Read file buffer
				const buffer = await data.toBuffer();

				// Generate filename - normalize both jpeg and jpg MIME types to .jpg extension
				let ext = data.mimetype.split('/')[1];
				if (ext === 'jpeg' || ext === 'jpg') {
					ext = 'jpg';
				}
				const filename = `avatar_${userId}_${Date.now()}.${ext}`;

				// Save to uploads directory
				const fs = await import('fs/promises');
				const path = await import('path');
				const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');

				// Create directory if not exists
				await fs.mkdir(uploadsDir, { recursive: true });

				const filePath = path.join(uploadsDir, filename);
				await fs.writeFile(filePath, buffer);

				// Update database with new avatar URL
				const avatarUrl = `/uploads/avatars/${filename}`;
				db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, userId);

				return reply.send({ message: 'Avatar uploaded successfully', avatarUrl });
			} catch (error: any) {
				fastify.log.error(error);

				// Check for file size limit errors
				if (error.code === 'FST_ERR_REQ_FILE_TOO_LARGE' || error.message?.includes('file too large') || error.message?.includes('File size limit exceeded')) {
					return reply.status(413).send({
						error: 'File size too large. Maximum file size is 5MB. Please compress or resize your image.'
					});
				}

				// Check for multipart errors
				if (error.code === 'FST_ERR_BUSY_REQUEST' || error.message?.includes('multipart')) {
					return reply.status(400).send({
						error: 'File upload error. Please try again with a smaller file.'
					});
				}

				return reply.status(500).send({ error: 'Failed to upload avatar' });
			}
		}
	);

	/**
	 * DELETE /:id/avatar
	 * Reset avatar to default
	 */
	fastify.delete<{ Params: { id: string } }>(
		'/:id/avatar',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const userId = parseInt(request.params.id, 10);

			if (isNaN(userId) || request.user?.userId !== userId) {
				return reply.status(403).send({ error: 'Unauthorized' });
			}

			try {
				db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('/default-avatar.png', userId);
				return reply.send({ message: 'Avatar reset to default' });
			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({ error: 'Failed to reset avatar' });
			}
		}
	);

	/**
	 * GET /search
	 * Search users by username or display name
	 */
	fastify.get<{ Querystring: { q: string } }>(
		'/search',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) => {
			const query = request.query.q;
			if (!query || query.length < 2) {
				return reply.send({ users: [] });
			}

			const users = db
				.prepare(
					`SELECT id, username, display_name as displayName, avatar_url as avatarUrl, is_online as isOnline
					 FROM users 
					 WHERE (username LIKE ? OR display_name LIKE ?) 
					   AND is_anonymized = FALSE
					 LIMIT 20`
				)
				.all(`%${query}%`, `%${query}%`);

			return reply.send({ users });
		}
	);

	/**
	 * GET /notifications
	 * Get current user's notifications
	 */
	fastify.get(
		'/notifications',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const userId = request.user?.userId;

			const notifications = db
				.prepare(
					`SELECT n.id, n.type, n.sender_id as senderId, n.status, n.data, n.created_at as createdAt,
					 u.display_name as senderName, u.avatar_url as senderAvatar
					 FROM notifications n
					 LEFT JOIN users u ON n.sender_id = u.id
					 WHERE n.user_id = ?
					 ORDER BY n.created_at DESC
					 LIMIT 50`
				)
				.all(userId);

			return reply.send({ notifications });
		}
	);

	/**
	 * PUT /notifications/:id/read
	 * Mark notification as read
	 */
	fastify.put<{ Params: { id: string } }>(
		'/notifications/:id/read',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const userId = request.user?.userId;
			const notificationId = parseInt(request.params.id, 10);

			const result = db
				.prepare('UPDATE notifications SET status = ? WHERE id = ? AND user_id = ?')
				.run('read', notificationId, userId);

			if (result.changes === 0) {
				return reply.status(404).send({ error: 'Notification not found' });
			}

			return reply.send({ success: true });
		}
	);

	/**
	 * GET /relationship/:targetId
	 * Check relationship status between current user and target user
	 */
	fastify.get<{ Params: { targetId: string } }>(
		'/relationship/:targetId',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { targetId: string } }>, reply: FastifyReply) => {
			const userId = request.user?.userId;
			const targetId = parseInt(request.params.targetId, 10);

			if (userId === targetId) {
				return reply.send({ status: 'self' });
			}

			const friendship = db
				.prepare(
					`SELECT user_id, friend_id, status 
					 FROM friendships 
					 WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`
				)
				.get(userId, targetId, targetId, userId) as { user_id: number; friend_id: number; status: string } | undefined;

			if (!friendship) {
				return reply.send({ status: 'none' });
			}

			if (friendship.status === 'accepted') {
				return reply.send({ status: 'friends' });
			}

			if (friendship.status === 'pending') {
				if (friendship.user_id === userId) {
					return reply.send({ status: 'request_sent' });
				} else {
					return reply.send({ status: 'request_received' });
				}
			}

			return reply.send({ status: friendship.status });
		}
	);

	/**
	 * POST /invite/:targetId
	 * Send a game invitation to a friend
	 */
	fastify.post<{ Params: { targetId: string } }>(
		'/invite/:targetId',
		{ preHandler: authMiddleware },
		async (request: FastifyRequest<{ Params: { targetId: string } }>, reply: FastifyReply) => {
			const userId = request.user?.userId;
			const targetId = parseInt(request.params.targetId, 10);

			// Verify they are friends
			const friendship = db
				.prepare(
					'SELECT status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
				)
				.get(userId, targetId, targetId, userId) as { status: string } | undefined;

			if (!friendship || friendship.status !== 'accepted') {
				return reply.code(403).send({ error: 'You must be friends to send game invites' });
			}

			// Generate a unique room ID
			const roomId = `invite_${Math.random().toString(36).substring(2, 10)}`;

			try {
				db.prepare(
					'INSERT INTO notifications (user_id, type, sender_id, status, data) VALUES (?, ?, ?, ?, ?)'
				).run(targetId, 'game_invite', userId, 'unread', roomId);

				return reply.send({ success: true, roomId });
			} catch (err) {
				return reply.code(500).send({ error: 'Failed to send invitation' });
			}
		}
	);
}
