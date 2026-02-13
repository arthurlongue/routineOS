"use client"

import { motion } from "motion/react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Celebration, type CelebrationProps } from "@/components/routine/celebration"
import type { DayItem } from "@/lib/types"

interface BlockCardProps {
	item: DayItem
	timeLabel: string
	isActive: boolean
	showTimer: boolean
	timerSlot?: ReactNode
	onComplete: () => void
	onSkip: () => void
	onUndo: () => void
	onStartTimer: () => void
	setCardRef: (element: HTMLDivElement | null) => void
	editHref?: string
	celebrationStyle?: CelebrationProps["style"]
	showCelebration?: boolean
	onCelebrationComplete?: () => void
}

export function BlockCard({
	item,
	timeLabel,
	isActive,
	showTimer,
	timerSlot,
	onComplete,
	onSkip,
	onUndo,
	onStartTimer,
	setCardRef,
	editHref,
	celebrationStyle = "particles",
	showCelebration = false,
	onCelebrationComplete,
}: BlockCardProps) {
	const status = item.entry.status
	const canSkip = item.block.isSkippable
	const statusConfig = STATUS_CONFIG[status]
	const cardClass =
		isActive || status === "active" ? STATUS_CONFIG.active.cardClass : statusConfig.cardClass

	return (
		<motion.article
			layout
			ref={setCardRef}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
			className={`${cardClass} relative overflow-hidden rounded-2xl`}
		>
			<Celebration
				style={celebrationStyle}
				isActive={showCelebration}
				onComplete={onCelebrationComplete}
			/>
			<div
				className="absolute inset-y-0 left-0 w-1.5"
				style={{ backgroundColor: item.block.color }}
			/>
			<div
				className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-30 blur-2xl"
				style={{ backgroundColor: item.block.color }}
			/>

			<div className="card-body p-4 md:p-5">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="font-mono text-base-content/55 text-sm">{timeLabel}</p>
						<p className="mt-1 font-semibold text-base-content text-xl leading-tight">
							{item.block.icon} {item.block.label}
						</p>
						<p className="mt-1 text-base-content/65 text-sm">
							~{item.block.defaultDurationMin} min
						</p>
					</div>
					<div
						className={
							status === "active" && isActive ? STATUS_CONFIG.active.badge : statusConfig.badge
						}
					>
						{status === "active" && isActive ? STATUS_CONFIG.active.label : statusConfig.label}
					</div>
				</div>

				{showTimer ? <div className="mt-3">{timerSlot}</div> : null}

				<div className="mt-3 flex flex-wrap gap-2">
					{status === "completed" || status === "skipped" ? (
						<button
							type="button"
							onClick={onUndo}
							className="btn btn-outline btn-sm min-h-11 rounded-xl"
						>
							Desfazer
						</button>
					) : (
						<>
							<button
								type="button"
								onClick={onComplete}
								className="btn btn-primary btn-sm min-h-11 rounded-xl"
							>
								Concluir
							</button>
							<button
								type="button"
								onClick={onSkip}
								disabled={!canSkip}
								className="btn btn-ghost btn-sm min-h-11 rounded-xl disabled:cursor-not-allowed"
							>
								Pular
							</button>
							{isActive && !showTimer ? (
								<button
									type="button"
									onClick={onStartTimer}
									className="btn btn-info btn-sm min-h-11 rounded-xl"
								>
									Cronômetro
								</button>
							) : null}
						</>
					)}
					{editHref ? (
						<Link href={editHref} className="btn btn-outline btn-sm min-h-11 rounded-xl">
							Editar
						</Link>
					) : null}
				</div>
			</div>
		</motion.article>
	)
}

const baseCardClass =
	"card border shadow-sm transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5"

const STATUS_CONFIG = {
	completed: {
		badge: "badge badge-success badge-outline uppercase",
		label: "feito",
		cardClass: `${baseCardClass} border-success/40 bg-success/10 opacity-85`,
	},
	skipped: {
		badge: "badge badge-ghost uppercase",
		label: "pulado",
		cardClass: `${baseCardClass} border-base-300 bg-base-200/65 opacity-75`,
	},
	active: {
		badge: "badge badge-primary uppercase",
		label: "agora",
		cardClass: `${baseCardClass} border-primary/70 bg-primary/15 ring-2 ring-primary/30`,
	},
	pending: {
		badge: "badge badge-outline uppercase",
		label: "pendente",
		cardClass: `${baseCardClass} border-base-300 bg-base-200/75`,
	},
} as const
