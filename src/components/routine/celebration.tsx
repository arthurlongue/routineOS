"use client"

import { motion } from "motion/react"
import { useEffect, useState } from "react"

export interface CelebrationProps {
	style: "confetti" | "particles" | "minimal" | "none"
	isActive: boolean
	onComplete?: () => void
}

export function Celebration({ style, isActive, onComplete }: CelebrationProps) {
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
		if (isActive && style !== "none" && !prefersReducedMotion) {
			const timer = window.setTimeout(() => {
				onComplete?.()
			}, 1500)

			return () => {
				window.clearTimeout(timer)
			}
		}
	}, [isActive, onComplete, style, prefersReducedMotion])

	if (!isActive || style === "none" || prefersReducedMotion) {
		return null
	}

	if (style === "minimal") {
		return <MinimalCelebration />
	}

	if (style === "particles") {
		return <ParticlesCelebration />
	}

	return <ConfettiCelebration />
}

function MinimalCelebration() {
	return (
		<motion.div
			className="pointer-events-none absolute inset-0 rounded-2xl"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="absolute inset-0 animate-pulse rounded-2xl bg-success/20" />
		</motion.div>
	)
}

function ParticlesCelebration() {
	const particles = Array.from({ length: 12 }, (_, i) => ({
		id: i,
		angle: i * 30 + Math.random() * 15,
		distance: 40 + Math.random() * 30,
		delay: Math.random() * 0.2,
	}))

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
			{particles.map((particle) => (
				<motion.div
					key={particle.id}
					className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-success"
					initial={{ opacity: 1, scale: 0 }}
					animate={{
						opacity: [1, 0],
						scale: [0, 1],
						x: [0, Math.cos((particle.angle * Math.PI) / 180) * particle.distance],
						y: [0, Math.sin((particle.angle * Math.PI) / 180) * particle.distance],
					}}
					transition={{
						duration: 0.6,
						delay: particle.delay,
						ease: "easeOut",
					}}
				/>
			))}
		</div>
	)
}

function ConfettiCelebration() {
	const confetti = Array.from({ length: 24 }, (_, i) => ({
		id: i,
		color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
		x: Math.random() * 100,
		delay: Math.random() * 0.3,
		duration: 0.8 + Math.random() * 0.4,
		rotation: Math.random() * 360,
	}))

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
			{confetti.map((piece) => (
				<motion.div
					key={piece.id}
					className="absolute h-2 w-1.5"
					style={{
						backgroundColor: piece.color,
						left: `${piece.x}%`,
						top: "-8px",
					}}
					initial={{ y: -8, opacity: 1, rotate: 0 }}
					animate={{
						y: 200,
						opacity: [1, 1, 0],
						rotate: piece.rotation + 720,
					}}
					transition={{
						duration: piece.duration,
						delay: piece.delay,
						ease: "easeIn",
					}}
				/>
			))}
		</div>
	)
}

const CONFETTI_COLORS = [
	"#22d3ee", // cyan
	"#a78bfa", // purple
	"#fbbf24", // amber
	"#34d399", // emerald
	"#f472b6", // pink
	"#60a5fa", // blue
]
