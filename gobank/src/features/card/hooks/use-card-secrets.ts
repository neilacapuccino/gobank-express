"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import type { CardKind } from "../components/bank-card";

type CvvState =
	| { status: "hidden" | "pending" }
	| { status: "visible"; cvv: string }
	| { status: "error"; message: string };

type CopyStatus = "idle" | "copied" | "error";

const COPY_FAILED = "Could not copy CVV. Try again.";

function errorText(cvv: CvvState, copyStatus: CopyStatus) {
	if (cvv.status === "error") return cvv.message;
	if (copyStatus === "error") return COPY_FAILED;
	return null;
}

export function useCardSecrets(kind: CardKind, locked: boolean) {
	const utils = api.useUtils();
	const [numberShown, setNumberShown] = useState(false);
	const [cvv, setCvv] = useState<CvvState>({ status: "hidden" });
	const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
	const latestRequest = useRef(0);

	useEffect(() => {
		if (!locked) return;

		latestRequest.current += 1;
		setNumberShown(false);
		setCvv({ status: "hidden" });
		setCopyStatus("idle");
	}, [locked]);

	const toggleNumber = () => setNumberShown((shown) => !shown);

	const toggleCvv = async () => {
		if (locked) return;

		const request = ++latestRequest.current;
		const isLatest = () => request === latestRequest.current;
		setCopyStatus("idle");

		if (cvv.status === "visible") {
			setCvv({ status: "hidden" });
			return;
		}

		setCvv({ status: "pending" });

		try {
			const details = await utils.client.card.revealCvv.query({ kind });
			if (isLatest()) setCvv({ status: "visible", cvv: details.cvv });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not load your CVV.";
			if (isLatest()) setCvv({ status: "error", message });
		}
	};

	const copyCvv = async () => {
		if (locked || cvv.status !== "visible") return;

		const request = latestRequest.current;
		const isLatest = () => request === latestRequest.current;

		try {
			await navigator.clipboard.writeText(cvv.cvv);
			if (isLatest()) setCopyStatus("copied");
		} catch {
			if (isLatest()) setCopyStatus("error");
		}
	};

	return {
		numberShown: numberShown && !locked,
		cvvShown: !locked && cvv.status === "visible" ? cvv.cvv : null,
		cvvLoading: cvv.status === "pending",
		copied: !locked && copyStatus === "copied",
		error: locked ? null : errorText(cvv, copyStatus),
		toggleNumber,
		toggleCvv,
		copyCvv,
	};
}
