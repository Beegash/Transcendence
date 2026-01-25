import { renderNavbar } from '../components/navbar';
import { gameSocket } from '../utils/gameSocket';
import { CleanupManager } from './game/utils/cleanup';
import { renderGameMenu } from './game/menu';
import { startLocalGame } from './game/local';
import { startAIGame, showAIReadyScreen } from './game/ai';
import {
	showOnlineLobby,
	showWaitingRoom,
	showReadyScreen,
	startInviteGame,
	startOnlineGame
} from './game/online';
import {
	startOnlineTournament,
	startOnlineTournamentGame
} from './game/tournament';
import type { GameMode, PlayerNumber } from './game/types';

// Global state
let currentMode: GameMode = 'menu';
let animationFrameId: number | null = null;
let playerNumber: PlayerNumber = 1;
let currentRoomId: string | null = null;
let currentTournamentId: number | null = null;
let currentTournamentMatchId: number | null = null;

// Cleanup manager
const cleanupManager = new CleanupManager();

export function renderGamePage(): void {
	renderNavbar();

	const app = document.getElementById('app');
	if (!app) return;

	// Cleanup previous game
	cleanup();

	let content = document.getElementById('page-content');
	if (!content) {
		content = document.createElement('div');
		content.id = 'page-content';
		app.appendChild(content);
	}

	// Check for tournament mode
	const urlParams = new URLSearchParams(window.location.search);
	const mode = urlParams.get('mode');

	if (mode === 'online-tournament') {
		const tournamentId = urlParams.get('tournamentId');
		const matchId = urlParams.get('matchId');

		if (tournamentId && matchId) {
			renderNavbar();
			currentTournamentId = parseInt(tournamentId);
			currentTournamentMatchId = parseInt(matchId);
			startOnlineTournament(
				content,
				currentTournamentId,
				currentTournamentMatchId,
				cleanupManager,
				setPlayerNumber,
				setCurrentRoomId,
				(roomId) => showWaitingRoomWrapper(content, roomId),
				(opponentName) => showReadyScreenWrapper(content, opponentName)
			);
			return;
		}
	}

	if (mode === 'invite') {
		const roomId = urlParams.get('roomId');
		const invitedUserId = urlParams.get('invitedUserId');
		if (roomId) {
			renderNavbar();
			startInviteGame(
				content,
				roomId,
				cleanupManager,
				() => {
					cleanup();
					renderGameMenu(content, onLocalPlay, onAIPlay, onOnlinePlay);
				},
				setPlayerNumber,
				setCurrentRoomId,
				(roomId) => showWaitingRoomWrapper(content, roomId),
				(opponentName) => showReadyScreenWrapper(content, opponentName),
				invitedUserId ? parseInt(invitedUserId) : undefined
			);
			return;
		}
	}

	renderNavbar();
	currentMode = 'menu';
	renderGameMenu(content, onLocalPlay, onAIPlay, onOnlinePlay);
}

function cleanup(): void {
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
	cleanupManager.cleanup();
	gameSocket.disconnect();

	// Reset tournament variables to prevent casual games being treated as tournament games
	currentTournamentId = null;
	currentTournamentMatchId = null;
	currentRoomId = null;
}

// Helper functions for state management
function setPlayerNumber(num: PlayerNumber): void {
	playerNumber = num;
}

function setCurrentRoomId(id: string | null): void {
	currentRoomId = id;
}

// Menu handlers
function onLocalPlay(): void {
	const content = document.getElementById('page-content')!;
	currentMode = 'local';
	startLocalGame(content, cleanupManager, () => {
		cleanup();
		renderGameMenu(content, onLocalPlay, onAIPlay, onOnlinePlay);
	});
}

function onAIPlay(): void {
	const content = document.getElementById('page-content')!;
	startAIGame(
		content,
		cleanupManager,
		() => {
			cleanup();
			renderGameMenu(content, onLocalPlay, onAIPlay, onOnlinePlay);
		},
		setPlayerNumber,
		setCurrentRoomId
	);

	// Set up the ready screen callback
	const originalAIRoomHandler = gameSocket.on('ai_room_created', (data) => {
		setPlayerNumber(1);
		setCurrentRoomId(data.roomId || null);
		showAIReadyScreen(content, cleanupManager, (state) => {
			// Reuse online game UI for AI games
			startOnlineGame(content, state, playerNumber, currentRoomId, cleanupManager);
		});
	});
	cleanupManager.add(originalAIRoomHandler);
}

function onOnlinePlay(): void {
	const content = document.getElementById('page-content')!;
	currentMode = 'online-lobby';
	showOnlineLobby(
		content,
		cleanupManager,
		() => {
			cleanup();
			renderGameMenu(content, onLocalPlay, onAIPlay, onOnlinePlay);
		},
		setPlayerNumber,
		setCurrentRoomId,
		(roomId) => showWaitingRoomWrapper(content, roomId),
		(opponentName) => showReadyScreenWrapper(content, opponentName)
	);
}

// Wrapper functions to handle callbacks properly
function showWaitingRoomWrapper(content: HTMLElement, roomId: string): void {
	currentMode = 'online-waiting';
	showWaitingRoom(
		content,
		roomId,
		playerNumber,
		cleanupManager,
		() => {
			cleanup();
			renderGameMenu(content, onLocalPlay, onAIPlay, onOnlinePlay);
		},
		(opponentName) => showReadyScreenWrapper(content, opponentName),
		() => onOnlinePlay()
	);
}

function showReadyScreenWrapper(content: HTMLElement, opponentName?: string): void {
	showReadyScreen(
		content,
		playerNumber,
		cleanupManager,
		(state) => {
			// Check if this is a tournament game
			if (currentTournamentId && currentTournamentMatchId) {
				startOnlineTournamentGame(
					content,
					state,
					currentTournamentId,
					currentTournamentMatchId,
					playerNumber,
					cleanupManager
				);
			} else {
				currentMode = 'online-playing';
				startOnlineGame(content, state, playerNumber, currentRoomId, cleanupManager);
			}
		},
		() => onOnlinePlay(),
		opponentName
	);
}
