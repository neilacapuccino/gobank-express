const FIRST_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

type LiveSocketHandlers = {
	onMessage: (message: unknown) => void;
	onDisconnect?: () => void;
};

export function openLiveSocket(url: string, handlers: LiveSocketHandlers) {
	let stopped = false;
	let socket: WebSocket | undefined;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
	let retryDelay = FIRST_RETRY_MS;

	const readMessage = (event: MessageEvent) => {
		if (stopped) return;

		try {
			handlers.onMessage(JSON.parse(String(event.data)) as unknown);
		} catch {
			return;
		}
	};

	const retryLater = () => {
		if (stopped) return;

		handlers.onDisconnect?.();
		retryTimer = setTimeout(connect, retryDelay);
		retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
	};

	function connect() {
		if (stopped) return;

		socket = new WebSocket(url);
		socket.onopen = () => {
			retryDelay = FIRST_RETRY_MS;
		};
		socket.onmessage = readMessage;
		socket.onerror = () => socket?.close();
		socket.onclose = retryLater;
	}

	connect();

	return {
		reconnect: () => {
			if (socket && socket.readyState !== WebSocket.CLOSED) socket.close();
		},
		stop: () => {
			stopped = true;
			clearTimeout(retryTimer);
			socket?.close();
		},
	};
}
