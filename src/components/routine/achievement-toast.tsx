"use client"

import { motion } from "motion/react"
import { useEffect, useState } from "react"

export interface Achievement {
	id: string
	title: string
	description: string
	icon: string
}

export interface AchievementToastProps {
	achievement: Achievement | null
	onDismiss: () => void
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

	useEffect(() => {
		if (typeof window === "undefined") {
			return
		}

		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
		setPrefersReducedMotion(mediaQuery.matches)

		const handler = (event: MediaQueryListEvent) => {
			setPrefersReducedMotion(event.matches)
		}

		mediaQuery.addEventListener("change", handler)
		return () => {
			mediaQuery.removeEventListener("change", handler)
		}
	}, [])

	useEffect(() => {
		if (!achievement) {
			return
		}

		const timer = window.setTimeout(() => {
			onDismiss()
		}, 3000)

		return () => {
			window.clearTimeout(timer)
		}
	}, [achievement, onDismiss])

	if (!achievement) {
		return null
	}

	if (prefersReducedMotion) {
		return (
			<div className="fixed top-4 right-4 z-50 max-w-sm" role="alert" aria-live="polite">
				<div className="alert alert-success shadow-lg">
					<div className="flex items-center gap-3">
						<span className="text-2xl" role="img" aria-hidden="true">
							{achievement.icon}
						</span>
						<div>
							<h3 className="font-semibold">{achievement.title}</h3>
							<p className="text-sm opacity-80">{achievement.description}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="btn btn-ghost btn-sm"
						aria-label="Fechar notificação"
					>
						✕
					</button>
				</div>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, x: 100, scale: 0.9 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: 100, scale: 0.9 }}
			transition={{ type: "spring", damping: 20, stiffness: 300 }}
			className="fixed top-4 right-4 z-50 max-w-sm"
			role="alert"
			aria-live="polite"
		>
			<div className="alert alert-success shadow-lg">
				<div className="flex items-center gap-3">
					<span className="text-2xl" role="img" aria-hidden="true">
						{achievement.icon}
					</span>
					<div>
						<h3 className="font-semibold">{achievement.title}</h3>
						<p className="text-sm opacity-80">{achievement.description}</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onDismiss}
					className="btn btn-ghost btn-sm"
					aria-label="Fechar notificação"
				>
					✕
				</button>
			</div>
		</motion.div>
	)
}
