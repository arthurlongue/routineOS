"use client"

import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { TimeProgress } from "@/components/routine/time-progress"
import { getAllTimeProgress } from "@/lib/utils/time-progress"

const TIME_ITEMS = [
	{ key: "year", label: "Ano", color: "#22d3ee" },
	{ key: "month", label: "Mês", color: "#a78bfa" },
	{ key: "week", label: "Semana", color: "#fbbf24" },
	{ key: "day", label: "Dia", color: "#34d399" },
] as const

type WidgetPosition = "left" | "right"

const STORAGE_KEY = "routineos-time-widget"

interface WidgetState {
	visible: boolean
	position: WidgetPosition
}

const DEFAULT_STATE: WidgetState = { visible: true, position: "right" }

function loadWidgetState(): WidgetState {
	if (typeof window === "undefined") return DEFAULT_STATE
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return DEFAULT_STATE
		const parsed = JSON.parse(raw) as Partial<WidgetState>
		return {
			visible: parsed.visible ?? DEFAULT_STATE.visible,
			position: parsed.position === "left" ? "left" : "right",
		}
	} catch {
		return DEFAULT_STATE
	}
}

function saveWidgetState(state: WidgetState) {
	if (typeof window === "undefined") return
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function TimeDashboard({ now }: { now: Date }) {
	const [state, setState] = useState<WidgetState>(DEFAULT_STATE)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setState(loadWidgetState())
		setMounted(true)
	}, [])

	const progress = getAllTimeProgress(now)

	const handleToggleVisible = useCallback(() => {
		setState((prev) => {
			const next = { ...prev, visible: !prev.visible }
			saveWidgetState(next)
			return next
		})
	}, [])

	const handleTogglePosition = useCallback(() => {
		setState((prev) => {
			const next = {
				...prev,
				position: (prev.position === "right" ? "left" : "right") as WidgetPosition,
			}
			saveWidgetState(next)
			return next
		})
	}, [])

	if (!mounted) return null

	const isRight = state.position === "right"

	return (
		<>
			{/* Floating trigger pill when widget is hidden */}
			<AnimatePresence>
				{!state.visible && (
					<motion.button
						type="button"
						onClick={handleToggleVisible}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.2 }}
						className="fixed top-20 z-40 flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200/90 px-3 py-2 shadow-lg backdrop-blur-sm hover:bg-base-200"
						style={{ [isRight ? "right" : "left"]: 16 }}
						title="Mostrar progressão do tempo"
					>
						<span className="text-sm">⏱</span>
						<span className="font-medium text-base-content/70 text-xs">Tempo</span>
					</motion.button>
				)}
			</AnimatePresence>

			{/* Main floating widget */}
			<AnimatePresence>
				{state.visible && (
					<motion.aside
						initial={{ opacity: 0, x: isRight ? 80 : -80 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: isRight ? 80 : -80 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="fixed top-20 z-40 flex flex-col gap-1 p-1"
						style={{ [isRight ? "right" : "left"]: 16 }}
						aria-label="Progressão do Tempo"
					>
						{/* Widget controls */}
						<div className="mb-1 flex items-center justify-between gap-2">
							{/* Position toggle */}
							<button
								type="button"
								onClick={handleTogglePosition}
								className="rounded-md p-1 text-base-content/40 transition-colors hover:bg-base-300/50 hover:text-base-content/70"
								title={isRight ? "Mover para esquerda" : "Mover para direita"}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									{isRight ? (
										<>
											<polyline points="15 18 9 12 15 6" />
											<line x1="4" y1="4" x2="4" y2="20" />
										</>
									) : (
										<>
											<polyline points="9 18 15 12 9 6" />
											<line x1="20" y1="4" x2="20" y2="20" />
										</>
									)}
								</svg>
							</button>

							{/* Hide button */}
							<button
								type="button"
								onClick={handleToggleVisible}
								className="rounded-md p-1 text-base-content/40 transition-colors hover:bg-base-300/50 hover:text-base-content/70"
								title="Ocultar widget"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</div>

						{/* Progress rings */}
						<div className="flex flex-col gap-3">
							{TIME_ITEMS.map((item) => (
								<TimeProgress
									key={item.key}
									label={item.label}
									percentage={progress[item.key]}
									color={item.color}
									size={56}
								/>
							))}
						</div>
					</motion.aside>
				)}
			</AnimatePresence>
		</>
	)
}
