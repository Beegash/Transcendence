/**
 * Stats Routes
 * API endpoints for user and game statistics
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as statsService from '../services/stats.js';
import { verifyToken } from '../services/auth.js';

export default async function statsRoutes(fastify: FastifyInstance) {
	/**
	 * GET /me - Get current user's stats
	 */
	fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
		const authHeader = request.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			return reply.status(401).send({ error: 'Authentication required' });
		}

		const token = authHeader.slice(7);
		const payload = verifyToken(token);
		if (!payload) {
			return reply.status(401).send({ error: 'Invalid token' });
		}

		const stats = statsService.getUserStats(payload.userId);
		if (!stats) {
			return reply.status(404).send({ error: 'Stats not found' });
		}

		return reply.send({ stats });
	});

	/**
	 * GET /me/history - Get current user's match history
	 */
	fastify.get('/me/history', async (request: FastifyRequest, reply: FastifyReply) => {
		const authHeader = request.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			return reply.status(401).send({ error: 'Authentication required' });
		}

		const token = authHeader.slice(7);
		const payload = verifyToken(token);
		if (!payload) {
			return reply.status(401).send({ error: 'Invalid token' });
		}

		const { limit = '20' } = request.query as { limit?: string };
		const history = statsService.getMatchHistory(payload.userId, parseInt(limit));

		return reply.send({ history });
	});

	/**
	 * GET /user/:id - Get specific user's stats (public)
	 */
	fastify.get('/user/:id', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: string };
		const stats = statsService.getUserStats(parseInt(id));

		if (!stats) {
			return reply.status(404).send({ error: 'User not found' });
		}

		return reply.send({ stats });
	});

	/**
	 * GET /user/:id/history - Get specific user's match history (public)
	 */
	fastify.get('/user/:id/history', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: string };
		const { limit = '20' } = request.query as { limit?: string };
		const history = statsService.getMatchHistory(parseInt(id), parseInt(limit));

		return reply.send({ history });
	});

	/**
	 * GET /leaderboard - Get top players
	 */
	fastify.get('/leaderboard', async (request: FastifyRequest, reply: FastifyReply) => {
		const { limit = '10' } = request.query as { limit?: string };
		const leaderboard = statsService.getLeaderboard(parseInt(limit));

		return reply.send({ leaderboard });
	});

	/**
	 * GET /global - Get global platform stats
	 */
	fastify.get('/global', async (_request: FastifyRequest, reply: FastifyReply) => {
		const stats = statsService.getGlobalStats();
		return reply.send({ stats });
	});
}
