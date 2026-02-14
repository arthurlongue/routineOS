"use client"

import type { Achievement } from "@/components/routine/achievement-toast"
import { AchievementToast } from "@/components/routine/achievement-toast"
import { BlockCard } from "@/components/routine/block-card"
import { CompletionCheckIn } from "@/components/routine/completion-checkin"
import { FocusMode } from "@/components/routine/focus-mode"
import { FocusProgress } from "@/components/routine/focus-progress"
import { ProgressBar } from "@/components/routine/progress-bar"
import { TaskFeedback } from "@/components/routine/task-feedback"
import { TimeDashboard } from "@/components/routine/time-dashboard"
import { Timer } from "@/components/routine/timer"
import { getOrCreateDayView, mutateEntryStatus } from "@/lib/db/queries"
import type { BlockStatus, DayItem } from "@/lib/types"
import { calculateEntryTimes, getActiveEntryId, getProgress } from "@/lib/utils/blocks"
import {
	type CompletionCheckIn as CompletionCheckInAnswers,
	serializeCompletionCheckIn,
} from "@/lib/utils/completion-checkin"
import { formatDateLabel, getDateKey } from "@/lib/utils/dates"
import { triggerFeedback } from "@/lib/utils/feedback"
import {
	type AppSettings,
	DEFAULT_SETTINGS,
	loadSettings,
	saveSettings,
} from "@/lib/utils/settings"
import { ChevronDown, ChevronUp, Download, LayoutGrid, LayoutList, Settings } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface DisplayItem extends DayItem {
	timeLabel: string
}

interface CompletionPromptTarget {
	entryId: string
	taskLabel: string
	durationMin?: number
}

export function HomeClient() {
	const [dateKey, setDateKey] = useState(getDateKey())
	const [items, setItems] = useState<DisplayItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [timerEntryId, setTimerEntryId] = useState<string | null>(null)
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
	const [viewMode, setViewMode] = useState<"focus" | "overview">("overview")
	const [focusIndex, setFocusIndex] = useState(0)
	const [completionPromptTarget, setCompletionPromptTarget] =
		useState<CompletionPromptTarget | null>(null)
	const [installPrompt, setInstallPrompt] = useState<{
		prompt: () => Promise<void>
		userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
	} | null>(null)
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const [achievement, setAchievement] = useState<Achievement | null>(null)
	const [celebrationEntryId, setCelebrationEntryId] = useState<string | null>(null)
	const [previousCompletedCount, setPreviousCompletedCount] = useState(0)
	const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
	const shouldReduceMotion = useReducedMotion()

	const loadDay = useCallback(async (targetDate: string, showLoader = false) => {
		if (showLoader) {
			setLoading(true)
		}

		try {
			const view = await getOrCreateDayView(targetDate)
			const times = calculateEntryTimes(view.items)
			const mapped = view.items
				.sort((a, b) => a.entry.order - b.entry.order)
				.map((item) => ({
					...item,
					timeLabel: times.get(item.entry.id) ?? "--:--",
				}))

			setItems(mapped)
			setError(null)

			const persistedActive = mapped.find((item) => item.entry.status === "active")
			setTimerEntryId((current) => current ?? persistedActive?.entry.id ?? null)
		} catch {
			setError("Não foi possível carregar a rotina de hoje")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadDay(dateKey, true)
	}, [dateKey, loadDay])

	useEffect(() => {
		setSettings(loadSettings())
	}, [])

	// Initialize viewMode from settings
	useEffect(() => {
		setViewMode(settings.defaultViewMode)
	}, [settings.defaultViewMode])

	// Auto-collapse header when entering focus mode
	useEffect(() => {
		if (viewMode === "focus") {
			setIsHeaderCollapsed(true)
		}
	}, [viewMode])

	// Apply compactHeader setting
	useEffect(() => {
		if (settings.compactHeader) {
			setIsHeaderCollapsed(true)
		}
	}, [settings.compactHeader])

	useEffect(() => {
		const id = window.setInterval(() => {
			const nextDateKey = getDateKey()
			if (nextDateKey !== dateKey) {
				setDateKey(nextDateKey)
				setTimerEntryId(null)
			}
		}, 30000)

		return () => {
			window.clearInterval(id)
		}
	}, [dateKey])

	useEffect(() => {
		const onBeforeInstall = (event: Event) => {
			event.preventDefault()
			setInstallPrompt(
				event as unknown as {
					prompt: () => Promise<void>
					userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
				},
			)
		}

		const onInstalled = () => setInstallPrompt(null)

		window.addEventListener("beforeinstallprompt", onBeforeInstall)
		window.addEventListener("appinstalled", onInstalled)

		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstall)
			window.removeEventListener("appinstalled", onInstalled)
		}
	}, [])

	const activeEntryId = useMemo(() => getActiveEntryId(items.map((item) => item.entry)), [items])

	useEffect(() => {
		if (!activeEntryId) {
			return
		}
		const node = cardRefs.current[activeEntryId]
		node?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [activeEntryId])

	const progress = useMemo(() => getProgress(items), [items])
	const dateLabel = useMemo(() => formatDateLabel(dateKey), [dateKey])
	const daySummary = useMemo(() => {
		const completed = items.filter((item) => item.entry.status === "completed").length
		const active = items.filter((item) => item.entry.status === "active").length
		const skipped = items.filter((item) => item.entry.status === "skipped").length
		const remaining = Math.max(0, items.length - completed - active - skipped)

		return {
			total: items.length,
			completed,
			active,
			remaining,
		}
	}, [items])

	// Detect achievements when items change
	useEffect(() => {
		const currentCompletedCount = daySummary.completed

		// Only check if completed count increased (new completion)
		if (currentCompletedCount > previousCompletedCount && currentCompletedCount > 0) {
			// Trigger feedback
			triggerFeedback({
				settings: settings.sensory,
				type: "completion",
			})

			// Check for first task achievement
			if (currentCompletedCount === 1 && previousCompletedCount === 0) {
				setAchievement({
					id: "first-task",
					title: "Primeira tarefa concluída!",
					description: "Ótimo começo! Continue assim.",
					icon: "🎯",
				})
				triggerFeedback({
					settings: settings.sensory,
					type: "achievement",
				})
			}

			// Check for all tasks completed
			if (currentCompletedCount === items.length) {
				setAchievement({
					id: "all-complete",
					title: "Dia completo!",
					description: "Você concluiu todas as tarefas de hoje!",
					icon: "🏆",
				})
				triggerFeedback({
					settings: settings.sensory,
					type: "achievement",
				})
			}
		}

		setPreviousCompletedCount(currentCompletedCount)
	}, [daySummary.completed, items.length, previousCompletedCount, settings.sensory])

	const handleStatusChange = useCallback(
		async (entryId: string, status: BlockStatus, durationMin?: number, notes?: string) => {
			if (status === "active") {
				if ("Notification" in window && Notification.permission === "default") {
					void Notification.requestPermission()
				}
				setTimerEntryId(entryId)
			} else if (timerEntryId === entryId) {
				setTimerEntryId(null)
			}

			// Trigger celebration when completing a task
			if (status === "completed") {
				setCelebrationEntryId(entryId)
			}

			await mutateEntryStatus({ entryId, status, durationMin, notes })
			await loadDay(dateKey)
		},
		[dateKey, loadDay, timerEntryId],
	)

	const handleCompleteRequest = useCallback(
		(entryId: string, taskLabel: string, durationMin?: number) => {
			if (!settings.askCompletionCheckIn) {
				void handleStatusChange(entryId, "completed", durationMin)
				return
			}

			setCompletionPromptTarget({
				entryId,
				taskLabel,
				durationMin,
			})
		},
		[handleStatusChange, settings.askCompletionCheckIn],
	)

	const handleCheckInSubmit = useCallback(
		(checkIn: CompletionCheckInAnswers) => {
			if (!completionPromptTarget) {
				return
			}

			const target = completionPromptTarget
			setCompletionPromptTarget(null)
			void handleStatusChange(
				target.entryId,
				"completed",
				target.durationMin,
				serializeCompletionCheckIn(checkIn),
			)
		},
		[completionPromptTarget, handleStatusChange],
	)

	const handleCheckInSkip = useCallback(() => {
		if (!completionPromptTarget) {
			return
		}

		const target = completionPromptTarget
		setCompletionPromptTarget(null)
		void handleStatusChange(target.entryId, "completed", target.durationMin)
	}, [completionPromptTarget, handleStatusChange])

	const onInstall = useCallback(async () => {
		if (!installPrompt) {
			return
		}
		await installPrompt.prompt()
		await installPrompt.userChoice
		setInstallPrompt(null)
	}, [installPrompt])

	const toggleViewMode = useCallback(() => {
		setViewMode((current) => {
			const newMode = current === "focus" ? "overview" : "focus"
			const newSettings: AppSettings = {
				...settings,
				defaultViewMode: newMode,
			}
			saveSettings(newSettings)
			setSettings(newSettings)
			return newMode
		})
	}, [settings])

	const toggleHeaderCollapsed = useCallback(() => {
		setIsHeaderCollapsed((prev) => !prev)
	}, [])

	// Sync focusIndex with activeEntryId
	useEffect(() => {
		if (viewMode === "focus" && activeEntryId) {
			const index = items.findIndex((item) => item.entry.id === activeEntryId)
			if (index !== -1) {
				setFocusIndex(index)
			}
		}
	}, [activeEntryId, items, viewMode])

	const handleStartTimer = useCallback(
		(entryId: string) => {
			void handleStatusChange(entryId, "active")
		},
		[handleStatusChange],
	)

	const handleNavigate = useCallback((index: number) => {
		setFocusIndex(index)
	}, [])

	const handleCelebrationComplete = useCallback(() => {
		setCelebrationEntryId(null)
	}, [])

	const handleDismissAchievement = useCallback(() => {
		setAchievement(null)
	}, [])

	// Compute timer slot for focus mode based on current item
	const focusModeTimerSlot = useMemo(() => {
		if (viewMode !== "focus" || items.length === 0) {
			return null
		}
		const currentItem = items[focusIndex]
		if (timerEntryId !== currentItem.entry.id) {
			return null
		}
		return (
			<Timer
				key={`${currentItem.entry.id}-${currentItem.entry.startedAt ?? "new"}`}
				durationSec={currentItem.block.defaultDurationMin * 60}
				startedAt={currentItem.entry.startedAt}
				onComplete={(durationMin) =>
					handleCompleteRequest(currentItem.entry.id, currentItem.block.label, durationMin)
				}
				onCancel={() => void handleStatusChange(currentItem.entry.id, "pending")}
				minimal={true}
			/>
		)
	}, [viewMode, items, focusIndex, timerEntryId, handleCompleteRequest, handleStatusChange])

	// Wrap handlers for FocusMode to match expected signatures
	const focusOnComplete = useCallback(
		(entryId: string) => {
			const item = items.find((i) => i.entry.id === entryId)
			if (item) {
				handleCompleteRequest(entryId, item.block.label)
			}
		},
		[items, handleCompleteRequest],
	)

	const focusOnSkip = useCallback(
		(entryId: string) => {
			void handleStatusChange(entryId, "skipped")
		},
		[handleStatusChange],
	)

	const focusOnUndo = useCallback(
		(entryId: string) => {
			void handleStatusChange(entryId, "pending")
		},
		[handleStatusChange],
	)

	const focusOnStartTimer = useCallback(
		(entryId: string) => {
			void handleStartTimer(entryId)
		},
		[handleStartTimer],
	)

	if (loading) {
		return (
			<div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
				<div className="flex items-center gap-3 text-base-content/70">
					<span className="loading loading-spinner loading-md" />
					<p>Carregando rotina...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
				<div className="alert alert-error max-w-lg">
					<p>{error}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28 md:px-6">
			<div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_15%_10%,rgb(34_211_238/0.12),transparent_40%),radial-gradient(circle_at_85%_0%,rgb(251_191_36/0.1),transparent_35%)]" />

			{/* Collapsible Header */}
			<motion.header
				layout={!shouldReduceMotion}
				className="mb-3 overflow-hidden rounded-2xl border border-base-300 bg-linear-to-br from-base-200/85 via-base-200/65 to-base-200/35 shadow-lg"
			>
				<motion.div layout className="px-4 py-3 md:px-5">
					{/* Always visible: Collapsed state content */}
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div>
								<p className="text-primary text-xs uppercase tracking-[0.2em]">RoutineOS</p>
								{isHeaderCollapsed && (
									<div className="mt-1 flex items-center gap-2">
										<FocusProgress
											completed={daySummary.completed}
											total={daySummary.total}
											currentIndex={focusIndex}
											mode="text"
										/>
									</div>
								)}
							</div>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={toggleViewMode}
								className="btn btn-outline btn-sm min-h-10 rounded-xl border-base-300 bg-base-100/65"
								data-tooltip={viewMode === "focus" ? "Visão geral" : "Modo foco"}
							>
								{viewMode === "focus" ? (
									<LayoutGrid className="h-4 w-4" />
								) : (
									<LayoutList className="h-4 w-4" />
								)}
								<span className="hidden sm:inline">
									{viewMode === "focus" ? "Visão geral" : "Modo foco"}
								</span>
							</button>

							<button
								type="button"
								onClick={toggleHeaderCollapsed}
								className="btn btn-ghost btn-sm min-h-10 rounded-xl"
								aria-label={isHeaderCollapsed ? "Expandir cabeçalho" : "Recolher cabeçalho"}
							>
								{isHeaderCollapsed ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronUp className="h-4 w-4" />
								)}
							</button>
						</div>
					</div>

					{/* Expandable content */}
					<AnimatePresence initial={false}>
						{!isHeaderCollapsed && (
							<motion.div
								initial={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
								transition={{ duration: 0.3, ease: "easeInOut" }}
								className="overflow-hidden"
							>
								<div className="mt-3">
									<div className="flex items-baseline gap-2">
										<h1 className="font-semibold text-base-content text-xl">O Trilho</h1>
										<span className="text-base-content/50 text-xs capitalize">{dateLabel}</span>
									</div>
								</div>

								<div className="mt-3 flex items-center gap-1.5">
									<Link
										href="/settings"
										className="btn btn-ghost btn-sm btn-square rounded-lg"
										title="Configurações"
									>
										<Settings className="h-4 w-4" />
									</Link>
									<Link
										href="/tasks"
										className="btn btn-ghost btn-sm btn-square rounded-lg"
										title="Gerenciar"
									>
										<LayoutList className="h-4 w-4" />
									</Link>
									{installPrompt ? (
										<button
											type="button"
											onClick={() => void onInstall()}
											className="btn btn-ghost btn-sm btn-square rounded-lg text-info"
											title="Instalar"
										>
											<Download className="h-4 w-4" />
										</button>
									) : null}
								</div>

								<div className="mt-2.5 flex items-center gap-2 overflow-x-auto">
									<SummaryPill label="Feitas" value={daySummary.completed} tone="success" />
									<SummaryPill label="Em foco" value={daySummary.active} tone="info" />
									<SummaryPill label="Restantes" value={daySummary.remaining} tone="ghost" />
									<SummaryPill label="Total" value={daySummary.total} tone="neutral" />
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</motion.header>

			{!isHeaderCollapsed && <TimeDashboard now={new Date()} />}

			<main className="space-y-3">
				{settings.showFeedbackOnHome && !isHeaderCollapsed ? <TaskFeedback items={items} /> : null}
				{viewMode === "focus" ? (
					<FocusMode
						items={items}
						currentIndex={focusIndex}
						onNavigate={handleNavigate}
						activeEntryId={activeEntryId}
						timerEntryId={timerEntryId}
						timerSlot={focusModeTimerSlot}
						onComplete={focusOnComplete}
						onSkip={focusOnSkip}
						onUndo={focusOnUndo}
						onStartTimer={focusOnStartTimer}
						editHref={(blockId) => `/tasks?edit=${blockId}`}
					/>
				) : (
					<AnimatePresence initial={false}>
						{items.map((item) => {
							const isActive = activeEntryId === item.entry.id
							const showTimer = timerEntryId === item.entry.id
							const showCelebration = celebrationEntryId === item.entry.id

							return (
								<motion.div key={item.entry.id} layout>
									<BlockCard
										item={item}
										timeLabel={item.timeLabel}
										isActive={isActive}
										showTimer={showTimer}
										timerSlot={
											showTimer ? (
												<Timer
													key={`${item.entry.id}-${item.entry.startedAt ?? "new"}`}
													durationSec={item.block.defaultDurationMin * 60}
													startedAt={item.entry.startedAt}
													onComplete={(durationMin) =>
														handleCompleteRequest(item.entry.id, item.block.label, durationMin)
													}
													onCancel={() => void handleStatusChange(item.entry.id, "pending")}
													minimal={false}
												/>
											) : null
										}
										onComplete={() => handleCompleteRequest(item.entry.id, item.block.label)}
										onSkip={() => void handleStatusChange(item.entry.id, "skipped")}
										onUndo={() => void handleStatusChange(item.entry.id, "pending")}
										onStartTimer={() => void handleStatusChange(item.entry.id, "active")}
										editHref={`/tasks?edit=${item.block.id}`}
										setCardRef={(element) => {
											cardRefs.current[item.entry.id] = element
										}}
										celebrationStyle={settings.sensory.celebrationStyle}
										showCelebration={showCelebration}
										onCelebrationComplete={handleCelebrationComplete}
									/>
								</motion.div>
							)
						})}
					</AnimatePresence>
				)}
			</main>

			<footer className="fixed inset-x-0 bottom-0 border-base-300 border-t bg-base-100/95 p-4 backdrop-blur">
				<div className="mx-auto w-full max-w-3xl">
					<ProgressBar
						completed={progress.completed}
						total={progress.total}
						skipped={progress.skipped}
					/>
				</div>
			</footer>

			<CompletionCheckIn
				isOpen={completionPromptTarget !== null}
				taskLabel={completionPromptTarget?.taskLabel ?? ""}
				onCancel={handleCheckInSkip}
				onSubmit={handleCheckInSubmit}
			/>

			<AchievementToast achievement={achievement} onDismiss={handleDismissAchievement} />
		</div>
	)
}

interface SummaryPillProps {
	label: string
	value: number
	tone: "success" | "info" | "ghost" | "neutral"
}

function SummaryPill({ label, value, tone }: SummaryPillProps) {
	const toneClass = {
		success: "border-success/30 bg-success/8 text-success",
		info: "border-info/30 bg-info/8 text-info",
		ghost: "border-base-300 bg-base-100/40 text-base-content/70",
		neutral: "border-base-300 bg-base-100/50 text-base-content/90",
	}[tone]

	return (
		<div
			className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 ${toneClass}`}
		>
			<span className="font-semibold text-xs tabular-nums">{value}</span>
			<span className="text-[10px] uppercase tracking-wide opacity-75">{label}</span>
		</div>
	)
}
