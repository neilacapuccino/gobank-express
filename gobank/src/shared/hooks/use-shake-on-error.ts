"use client";

import { useEffect, useRef } from "react";

const SHAKE_CLASS = "animate-shake";

export function useShakeOnError<Element extends HTMLElement>(
	error: string | null | undefined,
) {
	const ref = useRef<Element>(null);

	useEffect(() => {
		const element = ref.current;
		if (!error || !element) return;

		element.classList.remove(SHAKE_CLASS);
		void element.offsetWidth;
		element.classList.add(SHAKE_CLASS);
	}, [error]);

	return ref;
}
