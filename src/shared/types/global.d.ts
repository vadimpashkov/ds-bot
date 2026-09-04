export {};

declare global {
	var __DEBUG__: boolean;

	namespace globalThis {
		var __DEBUG__: boolean;
	}
}
