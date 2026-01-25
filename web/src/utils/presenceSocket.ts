// Presence WebSocket Client
// Maintains a persistent WebSocket connection to track user online status
//
// - Connects automatically when user is authenticated
// - Handles reconnection attempts
// - Properly disconnects on logout or browser/tab close


type PresenceMessageHandler = (data: PresenceMessage) => void;

export interface PresenceMessage {
	type: string;
	userId?: number;
	message?: string;
}

class PresenceSocket {
	private ws: WebSocket | null = null;
	private handlers: Map<string, Set<PresenceMessageHandler>> = new Map();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectDelay = 2000;
	private isIntentionalClose = false;
	private heartbeatTimeout: number | null = null;
	private token: string | null = null;

	constructor() {
		// Handle page unload - mark user as offline immediately
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => {
				this.disconnect(true);
			});

			// Also handle visibility change for mobile browsers
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'hidden') {
					// Send a ping to keep connection alive or let it timeout naturally
					if (this.ws?.readyState === WebSocket.OPEN) {
						this.ws.send(JSON.stringify({ type: 'pong' }));
					}
				} else if (document.visibilityState === 'visible') {
					// Page became visible again, ensure connection is active
					if (!this.isConnected() && this.token) {
						this.connect(this.token);
					}
				}
			});
		}
	}

	/**
	 * Connect to presence WebSocket server
	 */
	connect(token: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.ws?.readyState === WebSocket.OPEN) {
				resolve();
				return;
			}

			this.token = token;
			this.isIntentionalClose = false;

			// Use wss:// for secure connection
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${window.location.host}/api/presence/ws`;

			console.log('[PresenceSocket] Connecting to:', wsUrl);
			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log('[PresenceSocket] Connected, sending auth...');
				this.reconnectAttempts = 0;

				// Send auth token
				this.send({ type: 'auth', token });
				resolve();
			};

			this.ws.onclose = (event) => {
				console.log('[PresenceSocket] Connection closed:', event.code, event.reason);
				this.clearHeartbeatTimeout();
				this.emit({ type: 'disconnected' });

				// Auto reconnect if not intentional close
				if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
					this.reconnectAttempts++;
					const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
					console.log(`[PresenceSocket] Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
					
					setTimeout(() => {
						if (this.token && !this.isIntentionalClose) {
							this.connect(this.token).catch(() => {
								console.log('[PresenceSocket] Reconnect failed');
							});
						}
					}, delay);
				}
			};

			this.ws.onerror = (error) => {
				console.error('[PresenceSocket] Error:', error);
				reject(error);
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as PresenceMessage;
					console.log('[PresenceSocket] Message:', data.type);
					
					// Handle ping/pong for heartbeat
					if (data.type === 'ping') {
						this.send({ type: 'pong' });
						this.resetHeartbeatTimeout();
					}

					this.emit(data);
				} catch (e) {
					console.error('[PresenceSocket] Failed to parse message:', e);
				}
			};
		});
	}

	//Disconnect from WebSocket
	//@param isLogout - If true, sends logout message before closing
	  
	disconnect(isLogout: boolean = false): void {
		this.isIntentionalClose = true;
		this.clearHeartbeatTimeout();

		if (this.ws) {
			// Send logout message if this is an explicit logout
			if (isLogout && this.ws.readyState === WebSocket.OPEN) {
				try {
					this.ws.send(JSON.stringify({ type: 'logout' }));
				} catch (e) {
					// Ignore errors during close
				}
			}
			   
			this.ws.close();
			this.ws = null;
		}
		
		this.token = null;
		this.handlers.clear();
		this.reconnectAttempts = 0;
	}

	// Send a message to the server
	 
	private send(message: object): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	// Subscribe to a message type
	on(type: string, handler: PresenceMessageHandler): () => void {
		if (!this.handlers.has(type)) {
			this.handlers.set(type, new Set());
		}
		this.handlers.get(type)!.add(handler);

		return () => {
			this.handlers.get(type)?.delete(handler);
		};
	}

	// Emit a message to handlers
	private emit(message: PresenceMessage): void {
		this.handlers.get(message.type)?.forEach((handler) => handler(message));
		this.handlers.get('*')?.forEach((handler) => handler(message));
	}

	// Check if connected
	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	// Reset heartbeat timeout - called when we receive a ping
	private resetHeartbeatTimeout(): void {
		this.clearHeartbeatTimeout();
		// If we don't receive a ping within 60 seconds, assume connection is dead
		this.heartbeatTimeout = window.setTimeout(() => {
			console.log('[PresenceSocket] Heartbeat timeout, reconnecting...');
			if (this.ws) {
				this.ws.close();
			}
		}, 60000);
	}

	// Clear heartbeat timeout
	private clearHeartbeatTimeout(): void {
		if (this.heartbeatTimeout) {
			clearTimeout(this.heartbeatTimeout);
			this.heartbeatTimeout = null;
		}
	}
}

// Export singleton
export const presenceSocket = new PresenceSocket();
export default presenceSocket;

