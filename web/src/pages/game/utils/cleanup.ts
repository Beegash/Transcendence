import type { CleanupFunction } from '../types';

export class CleanupManager {
	private cleanupFunctions: CleanupFunction[] = [];

	add(fn: CleanupFunction): void {
		this.cleanupFunctions.push(fn);
	}

	cleanup(): void {
		this.cleanupFunctions.forEach(fn => fn());
		this.cleanupFunctions = [];
	}

	reset(): void {
		this.cleanup();
	}
}
