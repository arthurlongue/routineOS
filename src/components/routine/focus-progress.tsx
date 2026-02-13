"use client"

import { motion, useReducedMotion } from "motion/react"

interface FocusProgressProps {
	completed: number
	total: number
	currentIndex: number
	mode: "dots" | "ring" | "text"
}

export function FocusProgress({ completed, total, currentIndex, mode }: FocusProgressProps) {
	if (total === 0) {
		return null
	}

	switch (mode) {
		case "dots":
			return <DotsProgress completed={completed} total={total} currentIndex={currentIndex} />
		case "ring":
			return <RingProgress completed={completed} total={total} />
		case "text":
			return <TextProgress completed={completed} total={total} />
		default:
			return null
	}
}

interface DotsProgressProps {
	completed: number
	total: number
	currentIndex: number
}

function DotsProgress({ completed, total, currentIndex }: DotsProgressProps) {
	const shouldReduceMotion = useReducedMotion()
	const dots = Array.from({ length: total }, (_, i) => i)

	return (
		<div className="flex flex-wrap items-center justify-center gap-1.5" role="progressbar" aria-label={`${completed} de ${total} tarefas concluídas`}>
			{dots.map((index) => {
				const isCompleted = index < completed
				const isCurrent = index === currentIndex

				return (
					<motion.div
						key={index}
						initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
						animate={{ scale: isCurrent ? 1.2 : 1, opacity: 1 }}
						transition={{ duration: 0.2 }}
						className={`h-2 w-2 rounded-full ${
							isCompleted
								? "bg-success"
								: isCurrent
									? "bg-primary"
									: "bg-base-content/20"
						}`}
					/>
				)
			})}
		</div>
	)
}

interface RingProgressProps {
	completed: number
	total: number
}

function RingProgress({ completed, total }: RingProgressProps) {
	const shouldReduceMotion = useReducedMotion()
	const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
	const radius = 18
	const circumference = 2 * Math.PI * radius
	const strokeDashoffset = circumference - (percentage / 100) * circumference

	return (
		<div className="relative flex items-center justify-center" role="progressbar" aria-label={`${completed} de ${total} tarefas concluídas`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
			<svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 44 44">
				{/* Background circle */}
				<circle
					cx="22"
					cy="22"
					r={radius}
					stroke="currentColor"
					strokeWidth="3"
					fill="none"
					className="text-base-content/20"
				/>
				{/* Progress circle */}
				<motion.circle
					cx="22"
					cy="22"
					r={radius}
					stroke="currentColor"
					strokeWidth="3"
					fill="none"
					strokeLinecap="round"
					className="text-primary"
					initial={shouldReduceMotion ? {} : { strokeDashoffset: circumference }}
					animate={{ strokeDashoffset }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					style={{
						strokeDasharray: circumference,
					}}
				/>
			</svg>
			<span className="absolute font-semibold text-xs">{percentage}%</span>
		</div>
	)
}

interface TextProgressProps {
	completed: number
	total: number
}

function TextProgress({ completed, total }: TextProgressProps) {
	return (
		<span className="font-medium text-sm" role="progressbar" aria-label={`${completed} de ${total} tarefas concluídas`}>
			{completed}/{total}
		</span>
	)
}
