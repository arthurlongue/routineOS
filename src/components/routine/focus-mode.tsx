"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { BlockCard } from "@/components/routine/block-card"
import type { DayItem } from "@/lib/types"

interface DisplayItem extends DayItem {
	timeLabel: string
}

interface FocusModeProps {
	items: DisplayItem[]
	currentIndex: number
	onNavigate: (index: number) => void
	activeEntryId: string | null
	timerEntryId: string | null
	timerSlot: ReactNode
	onComplete: (entryId: string) => void
	onSkip: (entryId: string) => void
	onUndo: (entryId: string) => void
	onStartTimer: (entryId: string) => void
	editHref: (blockId: string) => string
}

export function FocusMode({
	items,
	currentIndex,
	onNavigate,
	activeEntryId,
	timerEntryId,
	timerSlot,
	onComplete,
	onSkip,
	onUndo,
	onStartTimer,
	editHref,
}: FocusModeProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const [touchStart, setTouchStart] = useState<number | null>(null)
	const [touchEnd, setTouchEnd] = useState<number | null>(null)
	const shouldReduceMotion = useReducedMotion()

	// Auto-scroll to current card
	useEffect(() => {
		const card = cardRefs.current[items[currentIndex]?.entry.id]
		if (card) {
			card.scrollIntoView({ behavior: "smooth", block: "center" })
		}
	}, [currentIndex, items])

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				e.preventDefault()
				onNavigate((currentIndex - 1 + items.length) % items.length)
			} else if (e.key === "ArrowRight") {
				e.preventDefault()
				onNavigate((currentIndex + 1) % items.length)
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [currentIndex, items.length, onNavigate])

	// Touch handlers
	const onTouchStart = useCallback((e: React.TouchEvent) => {
		setTouchEnd(null)
		setTouchStart(e.targetTouches[0].clientX)
	}, [])

	const onTouchMove = useCallback((e: React.TouchEvent) => {
		setTouchEnd(e.targetTouches[0].clientX)
	}, [])

	const onTouchEnd = useCallback(() => {
		if (!touchStart || !touchEnd) {
			return
		}
		const distance = touchStart - touchEnd
		const isLeftSwipe = distance > 50
		const isRightSwipe = distance < -50

		if (isLeftSwipe) {
			onNavigate((currentIndex + 1) % items.length)
		} else if (isRightSwipe) {
			onNavigate((currentIndex - 1 + items.length) % items.length)
		}
	}, [touchStart, touchEnd, currentIndex, items.length, onNavigate])

	const currentItem = items[currentIndex]

	if (items.length === 0) {
		return (
			<div className="flex min-h-64 items-center justify-center rounded-2xl border border-base-300 bg-base-200/50">
				<p className="text-base-content/60">Nenhuma tarefa para hoje</p>
			</div>
		)
	}

	return (
		<div
			ref={containerRef}
			className="flex min-h-[35vh] flex-col items-center justify-center gap-4"
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
		>
			{/* Progress dots */}
			<div
				className="flex flex-wrap items-center justify-center gap-2"
				role="tablist"
				aria-label="Navegação de tarefas"
			>
				{items.map((item, index) => {
					const isCompletedOrSkipped =
						item.entry.status === "completed" || item.entry.status === "skipped"
					const isCurrent = index === currentIndex

					return (
						<button
							key={item.entry.id}
							type="button"
							onClick={() => onNavigate(index)}
							className={`h-2 w-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
								isCurrent
									? "scale-110 bg-primary"
									: isCompletedOrSkipped
										? "bg-base-content/30"
										: "bg-base-content/20 hover:bg-base-content/40"
							}`}
							aria-label={`Tarefa ${index + 1} de ${items.length}${
								isCurrent ? " (atual)" : isCompletedOrSkipped ? " (concluída)" : ""
							}`}
							aria-selected={isCurrent}
							role="tab"
						/>
					)
				})}
			</div>

			{/* Card with flanking navigation */}
			<div className="flex w-full items-center gap-2">
				<button
					type="button"
					onClick={() => onNavigate((currentIndex - 1 + items.length) % items.length)}
					className="btn btn-circle btn-ghost btn-sm shrink-0 opacity-60 hover:opacity-100"
					aria-label="Tarefa anterior"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>

				<motion.div
					key={currentIndex}
					initial={shouldReduceMotion ? {} : { opacity: 0, x: 60 }}
					animate={{ opacity: 1, x: 0 }}
					exit={shouldReduceMotion ? {} : { opacity: 0, x: -60 }}
					transition={{ duration: 0.25, ease: "easeOut" }}
					className="min-w-0 flex-1"
				>
					<BlockCard
						item={currentItem}
						timeLabel={currentItem.timeLabel}
						isActive={activeEntryId === currentItem.entry.id}
						showTimer={timerEntryId === currentItem.entry.id}
						timerSlot={timerEntryId === currentItem.entry.id ? timerSlot : null}
						onComplete={() => onComplete(currentItem.entry.id)}
						onSkip={() => onSkip(currentItem.entry.id)}
						onUndo={() => onUndo(currentItem.entry.id)}
						onStartTimer={() => onStartTimer(currentItem.entry.id)}
						editHref={editHref(currentItem.block.id)}
						setCardRef={(element) => {
							cardRefs.current[currentItem.entry.id] = element
						}}
					/>
				</motion.div>

				<button
					type="button"
					onClick={() => onNavigate((currentIndex + 1) % items.length)}
					className="btn btn-circle btn-ghost btn-sm shrink-0 opacity-60 hover:opacity-100"
					aria-label="Próxima tarefa"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>

			{/* Counter + next up preview */}
			<div className="flex flex-col items-center gap-1">
				<p className="text-base-content/50 text-xs tabular-nums">
					{currentIndex + 1} / {items.length}
				</p>
				{items[currentIndex + 1] && (
					<p className="text-[10px] text-base-content/35">
						Próxima: {items[currentIndex + 1].block.icon} {items[currentIndex + 1].block.label}
					</p>
				)}
			</div>
		</div>
	)
}
