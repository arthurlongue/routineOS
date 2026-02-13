export interface CompletionCheckIn {
	mood: "up" | "down"
	timeWasCorrect: boolean
	startedOnTime: boolean
	endedOnTime: boolean
}

interface CompletionCheckInPayload {
	version: 1
	kind: "completion-checkin"
	data: CompletionCheckIn
}

export function serializeCompletionCheckIn(checkIn: CompletionCheckIn): string {
	const payload: CompletionCheckInPayload = {
		version: 1,
		kind: "completion-checkin",
		data: checkIn,
	}

	return JSON.stringify(payload)
}

export function parseCompletionCheckIn(notes?: string): CompletionCheckIn | null {
	if (!notes) {
		return null
	}

	try {
		const parsed = JSON.parse(notes) as Partial<CompletionCheckInPayload>
		if (parsed.kind !== "completion-checkin" || parsed.version !== 1 || !parsed.data) {
			return null
		}

		const data = parsed.data
		if (data.mood !== "up" && data.mood !== "down") {
			return null
		}

		if (
			typeof data.timeWasCorrect !== "boolean" ||
			typeof data.startedOnTime !== "boolean" ||
			typeof data.endedOnTime !== "boolean"
		) {
			return null
		}

		return {
			mood: data.mood,
			timeWasCorrect: data.timeWasCorrect,
			startedOnTime: data.startedOnTime,
			endedOnTime: data.endedOnTime,
		}
	} catch {
		return null
	}
}
