import type { DayItem } from "@/lib/types"
import { parseCompletionCheckIn } from "@/lib/utils/completion-checkin"

const FAST_RATIO_THRESHOLD = 0.6
const SLOW_RATIO_THRESHOLD = 1.4

export interface TaskFeedbackItem {
	entryId: string
	label: string
	status: DayItem["entry"]["status"]
	expectedMin: number
	actualMin?: number
	feedback: "correct" | "not-done" | "too-fast" | "too-slow" | "insufficient-data"
	problem: string
}

export interface TaskFeedbackProblem {
	label: string
	count: number
}

export interface TaskFeedbackSummary {
	total: number
	correct: number
	notDone: number
	tooFast: number
	tooSlow: number
	insufficientData: number
	items: TaskFeedbackItem[]
	problems: TaskFeedbackProblem[]
}

export function analyzeTaskFeedback(items: DayItem[]): TaskFeedbackSummary {
	const feedbackItems = items.map((item) => analyzeItem(item))
	const problemsMap = new Map<string, number>()

	for (const feedbackItem of feedbackItems) {
		const current = problemsMap.get(feedbackItem.problem) ?? 0
		problemsMap.set(feedbackItem.problem, current + 1)
	}

	return {
		total: feedbackItems.length,
		correct: feedbackItems.filter((item) => item.feedback === "correct").length,
		notDone: feedbackItems.filter((item) => item.feedback === "not-done").length,
		tooFast: feedbackItems.filter((item) => item.feedback === "too-fast").length,
		tooSlow: feedbackItems.filter((item) => item.feedback === "too-slow").length,
		insufficientData: feedbackItems.filter((item) => item.feedback === "insufficient-data").length,
		items: feedbackItems,
		problems: [...problemsMap.entries()]
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count),
	}
}

function analyzeItem(item: DayItem): TaskFeedbackItem {
	const expectedMin = item.block.defaultDurationMin
	const actualMin = item.entry.durationMin
	const status = item.entry.status
	const checkIn = parseCompletionCheckIn(item.entry.notes)
	const common = {
		entryId: item.entry.id,
		label: item.block.label,
		status,
		expectedMin,
		actualMin,
	}

	if (status === "pending") {
		return {
			...common,
			feedback: "not-done",
			problem: "Tarefa não iniciada",
		}
	}

	if (status === "active") {
		return {
			...common,
			feedback: "not-done",
			problem: "Tarefa ainda em andamento",
		}
	}

	if (status === "skipped") {
		return {
			...common,
			feedback: "not-done",
			problem: "Tarefa pulada",
		}
	}

	if (typeof actualMin !== "number") {
		return {
			...common,
			feedback: "insufficient-data",
			problem: "Conclusão sem tempo registrado",
		}
	}

	if (expectedMin <= 0) {
		return {
			...common,
			feedback: "correct",
			problem: "Sem duração planejada para comparação",
		}
	}

	const ratio = actualMin / expectedMin

	if (checkIn && !checkIn.startedOnTime && !checkIn.endedOnTime) {
		return {
			...common,
			feedback: "too-slow",
			problem: "Início e término fora do horário",
		}
	}

	if (checkIn && !checkIn.startedOnTime) {
		return {
			...common,
			feedback: "too-slow",
			problem: "Início fora do horário",
		}
	}

	if (checkIn && !checkIn.endedOnTime) {
		return {
			...common,
			feedback: "too-slow",
			problem: "Término fora do horário",
		}
	}

	if (checkIn && !checkIn.timeWasCorrect) {
		return {
			...common,
			feedback: ratio <= 1 ? "too-fast" : "too-slow",
			problem: ratio <= 1 ? "Tempo percebido como curto" : "Tempo percebido como longo",
		}
	}

	if (checkIn && checkIn.mood === "down") {
		return {
			...common,
			feedback: "too-slow",
			problem: "Execução com baixa satisfação",
		}
	}

	if (ratio < FAST_RATIO_THRESHOLD) {
		return {
			...common,
			feedback: "too-fast",
			problem: "Tempo real abaixo do planejado",
		}
	}

	if (ratio > SLOW_RATIO_THRESHOLD) {
		return {
			...common,
			feedback: "too-slow",
			problem: "Tempo real acima do planejado",
		}
	}

	return {
		...common,
		feedback: "correct",
		problem: "Execução dentro da faixa esperada",
	}
}
