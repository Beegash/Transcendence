/**
 * Game WebSocket Client
 * Handles WebSocket connection for multiplayer Pong
 */

type MessageHandler = (data: GameMessage) => void;

export interface GameState {
	ball: { x: number; y: number };
	score: { player1: number; player2: number };
	status: 'waiting' | 'ready' | 'playing' | 'finished';
	winner?: 1 | 2;
	paddles: { player1: number; player2: number };
}

export interface GameMessage {
	type: string;
	roomId?: string;
	player?: 1 | 2;
	playerId?: string;
	state?: GameState;
	winner?: 1 | 2;
	message?: string;
	username?: string;
	tournamentId?: number;
}

class GameSocket {
	private ws: WebSocket | null = null;
	private handlers: Map<string, Set<MessageHandler>> = new Map();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	/**
	 * Connect to game WebSocket server
	 */
	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.ws?.readyState === WebSocket.OPEN) {
				resolve();
				return;
			}

			// Use wss:// for secure connection
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${window.location.host}/api/game/ws`;

			console.log('Connecting to WebSocket:', wsUrl);
			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log('WebSocket connected');
				this.reconnectAttempts = 0;

				// Send auth token if available
				const token = localStorage.getItem('auth_token');
				if (token) {
					this.send({ type: 'auth', token });
				}

				resolve();
			};

			this.ws.onclose = (event) => {
				console.log('WebSocket closed:', event.code, event.reason);
				this.emit({ type: 'disconnected' });

				// Auto reconnect
				if (this.reconnectAttempts < this.maxReconnectAttempts) {
					this.reconnectAttempts++;
					setTimeout(() => {
						console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
						this.connect();
					}, this.reconnectDelay * this.reconnectAttempts);
				}
			};

			this.ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				reject(error);
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as GameMessage;
					this.emit(data);
				} catch (e) {
					console.error('Failed to parse WebSocket message:', e);
				}
			};
		});
	}

	/**
	 * Disconnect from WebSocket
	 */
	disconnect(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.handlers.clear();
	}

	/**
	 * Send a message to the server
	 */
	send(message: object): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			console.error('WebSocket not connected');
		}
	}

	/**
	 * Create a new game room
	 */
	createRoom(): void {
		this.send({ type: 'create_room' });
	}

	/**
	 * Create a room for AI game
	 */
	createAIRoom(): void {
		this.send({ type: 'create_ai_room' });
	}

	/**
	 * Join an existing room
	 */
	joinRoom(roomId: string): void {
		this.send({ type: 'join_room', roomId: roomId.toUpperCase() });
	}

	/**
	 * Send paddle position
	 */
	movePaddle(position: number): void {
		this.send({ type: 'paddle_move', position });
	}

	/**
	 * Signal ready to play
	 */
	ready(): void {
		this.send({ type: 'ready' });
	}

	/**
	 * Subscribe to a message type
	 */
	on(type: string, handler: MessageHandler): () => void {
		if (!this.handlers.has(type)) {
			this.handlers.set(type, new Set());
		}
		this.handlers.get(type)!.add(handler);

		// Return unsubscribe function
		return () => {
			this.handlers.get(type)?.delete(handler);
		};
	}

	/**
	 * Emit a message to handlers
	 */
	private emit(message: GameMessage): void {
		// Call specific type handlers
		this.handlers.get(message.type)?.forEach((handler) => handler(message));

		// Call wildcard handlers
		this.handlers.get('*')?.forEach((handler) => handler(message));
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}

// Export singleton
export const gameSocket = new GameSocket();
export default gameSocket;
