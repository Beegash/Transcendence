/**
 * Tournament Routes
 * API endpoints for tournament management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as tournamentService from '../services/tournament.js';
import { verifyToken } from '../services/auth.js';

interface CreateTournamentBody {
	name: string;
	maxPlayers?: number;
}

interface JoinTournamentBody {
	alias: string;
}

interface RecordResultBody {
	player1Score: number;
	player2Score: number;
}

export default async function tournamentRoutes(fastify: FastifyInstance) {
	/**
	 * GET / - List all tournaments
	 */
	fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
		const { status } = request.query as { status?: string };
		const tournaments = tournamentService.getAllTournaments(status);
		return reply.send({ tournaments });
	});

	/**
	 * POST / - Create new tournament
	 */
	fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
		const authHeader = request.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			return reply.status(401).send({ error: 'Authentication required' });
		}

		const token = authHeader.slice(7);
		const payload = verifyToken(token);
		if (!payload) {
			return reply.status(401).send({ error: 'Invalid token' });
		}

		const { name, maxPlayers = 8 } = request.body as CreateTournamentBody;

		if (!name || name.trim().length < 1) {
			return reply.status(400).send({ error: 'Tournament name is required' });
		}

		const tournament = tournamentService.createTournament(name.trim(), maxPlayers, payload.userId);
		return reply.status(201).send({ tournament });
	});

	/**
	 * GET /:id - Get tournament details
	 */
	fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: string };
		const tournament = tournamentService.getTournamentById(parseInt(id));

		if (!tournament) {
			return reply.status(404).send({ error: 'Tournament not found' });
		}

		const participants = tournamentService.getParticipants(tournament.id);
		return reply.send({ tournament, participants });
	});

	/**
	 * GET /:id/bracket - Get tournament bracket
	 */
	fastify.get('/:id/bracket', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: string };
		const bracket = tournamentService.getBracket(parseInt(id));

		if (!bracket.tournament) {
			return reply.status(404).send({ error: 'Tournament not found' });
		}

		return reply.send(bracket);
	});

	/**
	 * POST /:id/join - Join tournament with alias
	 */
	fastify.post('/:id/join', async (request: FastifyRequest, reply: FastifyReply) => {
		const authHeader = request.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			return reply.status(401).send({ error: 'Authentication required' });
		}

		const token = authHeader.slice(7);
		const payload = verifyToken(token);
		if (!payload) {
			return reply.status(401).send({ error: 'Invalid token' });
		}

		const { id } = request.params as { id: string };
		const { alias } = request.body as JoinTournamentBody;

		if (!alias || alias.trim().length < 1) {
			return reply.status(400).send({ error: 'Alias is required' });
		}

		if (alias.trim().length > 20) {
			return reply.status(400).send({ error: 'Alias must be 20 characters or less' });
		}

		// Check if user already joined
		const tournamentId = parseInt(id);
		const participants = tournamentService.getParticipants(tournamentId);
		if (participants.some(p => p.user_id === payload.userId)) {
			return reply.status(400).send({ error: 'You have already joined this tournament' });
		}

		const participant = tournamentService.joinTournament(tournamentId, alias.trim(), payload.userId);

		if (!participant) {
			return reply.status(400).send({
				error: 'Could not join tournament. It may be full, already started, or alias is taken.'
			});
		}

		return reply.status(201).send({ participant });
	});

	/**
	 * POST /:id/start - Start tournament
	 */
	fastify.post('/:id/start', async (request: FastifyRequest, reply: FastifyReply) => {
		const authHeader = request.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			return reply.status(401).send({ error: 'Authentication required' });
		}

		const token = authHeader.slice(7);
		const payload = verifyToken(token);
		if (!payload) {
			return reply.status(401).send({ error: 'Invalid token' });
		}

		const { id } = request.params as { id: string };
		const tournamentId = parseInt(id);
		const tournament = tournamentService.getTournamentById(tournamentId);

		if (!tournament) {
			return reply.status(404).send({ error: 'Tournament not found' });
		}

		if (tournament.created_by !== payload.userId) {
			return reply.status(403).send({ error: 'Only the creator can start the tournament' });
		}

		const success = tournamentService.startTournament(tournamentId);

		if (!success) {
			return reply.status(400).send({
				error: 'Could not start tournament. Need at least 2 participants and tournament must be pending.'
			});
		}

		const bracket = tournamentService.getBracket(tournamentId);
		return reply.send({ message: 'Tournament started', bracket });
	});

	/**
	 * GET /:id/current-match - Get current match to play
	 */
	fastify.get('/:id/current-match', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id } = request.params as { id: string };
		const match = tournamentService.getCurrentMatch(parseInt(id));

		if (!match) {
			return reply.send({ match: null, message: 'No pending matches' });
		}

		return reply.send({ match });
	});

	/**
	 * POST /:id/match/:matchId/result - Record match result
	 */
	fastify.post('/:id/match/:matchId/result', async (request: FastifyRequest, reply: FastifyReply) => {
		const { matchId } = request.params as { id: string; matchId: string };
		const { player1Score, player2Score } = request.body as RecordResultBody;

		if (typeof player1Score !== 'number' || typeof player2Score !== 'number') {
			return reply.status(400).send({ error: 'Scores are required' });
		}

		if (player1Score === player2Score) {
			return reply.status(400).send({ error: 'Match cannot end in a tie' });
		}

		const success = tournamentService.recordMatchResult(parseInt(matchId), player1Score, player2Score);

		if (!success) {
			return reply.status(400).send({ error: 'Could not record result' });
		}

		return reply.send({ message: 'Result recorded' });
	});
}
