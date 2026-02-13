"use client"

import { AnimatePresence, motion } from "motion/react"
import { useMemo, useState } from "react"

import type { DayItem } from "@/lib/types"
import { analyzeTaskFeedback } from "@/lib/utils/task-feedback"

interface TaskFeedbackProps {
	items: DayItem[]
}

export function TaskFeedback({ items }: TaskFeedbackProps) {
	const summary = useMemo(() => analyzeTaskFeedback(items), [items])
	const [isExpanded, setIsExpanded] = useState(false)
	const totalIssues = summary.notDone + summary.tooFast + summary.tooSlow

	return (
		<section className="card border border-base-300 bg-base-200/70 shadow-sm">
			<div className="card-body gap-4 p-4">
				<button
					type="button"
					onClick={() => setIsExpanded((current) => !current)}
					className="flex w-full items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100/70 px-3 py-2 text-left"
					aria-expanded={isExpanded}
					aria-controls="task-feedback-content"
				>
					<div>
						<p className="text-primary text-xs uppercase tracking-[0.2em]">Feedback</p>
						<p className="mt-1 font-medium text-base-content text-sm">
							{totalIssues > 0
								? `${totalIssues} ponto(s) para revisar hoje`
								: "Sem alertas importantes hoje"}
						</p>
					</div>
					<span className="badge badge-outline">{isExpanded ? "Ocultar" : "Ver"}</span>
				</button>

				<AnimatePresence initial={false}>
					{isExpanded ? (
						<motion.div
							id="task-feedback-content"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="space-y-3 overflow-hidden"
						>
							<div className="stats stats-vertical md:stats-horizontal bg-base-100/70 shadow-sm">
								<div className="stat px-4 py-3">
									<div className="stat-title text-xs">Feitas corretamente</div>
									<div className="stat-value text-success text-xl">{summary.correct}</div>
									<div className="stat-desc">dentro da duração esperada</div>
								</div>
								<div className="stat px-4 py-3">
									<div className="stat-title text-xs">Não feitas</div>
									<div className="stat-value text-error text-xl">{summary.notDone}</div>
									<div className="stat-desc">pendentes, em andamento ou puladas</div>
								</div>
								<div className="stat px-4 py-3">
									<div className="stat-title text-xs">Tempo fora do ideal</div>
									<div className="stat-value text-warning text-xl">
										{summary.tooFast + summary.tooSlow}
									</div>
									<div className="stat-desc">
										{summary.tooFast} curtas | {summary.tooSlow} longas
									</div>
								</div>
							</div>

							<div className="grid gap-3 md:grid-cols-2">
								<div className="rounded-box border border-base-300 bg-base-100/60 p-3">
									<p className="font-medium text-base-content text-sm">Problemas mais comuns</p>
									{summary.problems.length === 0 ? (
										<p className="mt-2 text-base-content/70 text-sm">Sem dados para hoje.</p>
									) : (
										<ul className="mt-2 space-y-1 text-sm">
											{summary.problems.slice(0, 4).map((problem) => (
												<li key={problem.label} className="flex items-center justify-between gap-3">
													<span className="text-base-content/80">{problem.label}</span>
													<span className="badge badge-outline badge-sm">{problem.count}</span>
												</li>
											))}
										</ul>
									)}
								</div>

								<div className="rounded-box border border-base-300 bg-base-100/60 p-3">
									<p className="font-medium text-base-content text-sm">Tarefas de hoje</p>
									{summary.items.length === 0 ? (
										<p className="mt-2 text-base-content/70 text-sm">Nenhuma tarefa no dia.</p>
									) : (
										<ul className="mt-2 space-y-2 text-sm">
											{summary.items.map((item) => (
												<li
													key={item.entryId}
													className="flex items-center justify-between gap-3 rounded-lg border border-base-300 bg-base-100/70 px-2 py-1.5"
												>
													<div className="min-w-0">
														<p className="truncate text-base-content">{item.label}</p>
														<p className="truncate text-base-content/65 text-xs">{item.problem}</p>
													</div>
													<span className={FEEDBACK_CONFIG[item.feedback].badge}>
														{FEEDBACK_CONFIG[item.feedback].label}
													</span>
												</li>
											))}
										</ul>
									)}
								</div>
							</div>

							{summary.insufficientData > 0 ? (
								<p className="text-base-content/70 text-xs">
									{summary.insufficientData} tarefa(s) foram concluídas sem tempo registrado.
								</p>
							) : null}
						</motion.div>
					) : null}
				</AnimatePresence>
			</div>
		</section>
	)
}

const FEEDBACK_CONFIG = {
	correct: { label: "Correta", badge: "badge badge-success badge-outline" },
	"not-done": { label: "Não feita", badge: "badge badge-error badge-outline" },
	"too-fast": { label: "Muito curta", badge: "badge badge-warning badge-outline" },
	"too-slow": { label: "Muito longa", badge: "badge badge-warning badge-outline" },
	"insufficient-data": { label: "Sem dados", badge: "badge badge-neutral badge-outline" },
} as const
