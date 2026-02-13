"use client"

import { motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"

interface TimerProps {
	durationSec: number
	startedAt?: string
	onComplete: (durationMin: number) => void | Promise<void>
	onCancel: () => void | Promise<void>
	minimal?: boolean
}

export function Timer({ durationSec, startedAt, onComplete, onCancel, minimal = false }: TimerProps) {
	const [remainingSec, setRemainingSec] = useState(() =>
		getInitialRemaining(durationSec, startedAt),
	)
	const [isRunning, setIsRunning] = useState(() => remainingSec > 0)
	const shouldReduceMotion = useReducedMotion()

	useEffect(() => {
		if (!isRunning) {
			return
		}
		if (remainingSec <= 0) {
			return
		}

		const id = window.setInterval(() => {
			setRemainingSec((prev) => Math.max(0, prev - 1))
		}, 1000)

		return () => {
			window.clearInterval(id)
		}
	}, [isRunning, remainingSec])

	useEffect(() => {
		if (remainingSec > 0) {
			return
		}
		void notifyTimerDone()
		void onComplete(resolveElapsedMinutes(durationSec, startedAt))
	}, [durationSec, onComplete, remainingSec, startedAt])

	const progress =
		durationSec <= 0
			? 100
			: Math.max(0, Math.min(100, ((durationSec - remainingSec) / durationSec) * 100))

	if (minimal) {
		return (
			<MinimalTimer
				remainingSec={remainingSec}
				isRunning={isRunning}
				progress={progress}
				onToggleRunning={() => setIsRunning((prev) => !prev)}
				onComplete={() => void onComplete(resolveElapsedMinutes(durationSec, startedAt))}
				shouldReduceMotion={shouldReduceMotion}
			/>
		)
	}

	return (
		<div className="card border border-info/40 bg-info/10">
			<div className="card-body gap-3 p-3">
				<div className="flex items-center justify-between gap-3">
					<p className="font-mono text-info-content text-lg">{formatRemaining(remainingSec)}</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setIsRunning((prev) => !prev)}
							className="btn btn-info btn-sm min-h-11"
						>
							{isRunning ? "Pausar" : "Retomar"}
						</button>
						<button
							type="button"
							onClick={() => void onCancel()}
							className="btn btn-outline btn-sm min-h-11"
						>
							Cancelar
						</button>
					</div>
				</div>
				<div className="mt-1">
					<progress className="progress progress-info w-full" value={progress} max={100} />
				</div>
			</div>
		</div>
	)
}

interface MinimalTimerProps {
	remainingSec: number
	isRunning: boolean
	progress: number
	onToggleRunning: () => void
	onComplete: () => void
	shouldReduceMotion: boolean
}

function MinimalTimer({
	remainingSec,
	isRunning,
	progress,
	onToggleRunning,
	onComplete,
	shouldReduceMotion,
}: MinimalTimerProps) {
	return (
		<div className="flex flex-col items-center gap-4 py-4">
			{/* Large time display with breathing animation */}
			<motion.div
				animate={
					shouldReduceMotion || !isRunning
						? {}
						: {
								scale: [1, 1.02, 1],
							}
				}
				transition={
					shouldReduceMotion
						? { duration: 0 }
						: {
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}
				}
				className="relative"
			>
				<p className="font-mono text-5xl tracking-tight">
					{formatRemaining(remainingSec)}
				</p>
				{isRunning ? (
					<motion.span
						animate={{ opacity: [1, 0.5, 1] }}
						transition={{
							duration: 1,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
						className="absolute -right-3 top-0 text-primary"
					>
						●
					</motion.span>
				) : null}
			</motion.div>

			{/* Full-width progress bar */}
			<div className="w-full">
				<motion.div
					className="h-1 rounded-full bg-primary"
					initial={false}
					animate={{ width: `${progress}%` }}
					transition={{ duration: 0.3, ease: "easeOut" }}
				/>
			</div>

			{/* Action buttons */}
			<div className="flex w-full gap-3">
				<button
					type="button"
					onClick={onToggleRunning}
					className="btn btn-outline btn-lg flex-1"
				>
					{isRunning ? "Pausar" : "Retomar"}
				</button>
				<button
					type="button"
					onClick={onComplete}
					className="btn btn-success btn-lg flex-1"
				>
					Concluir
				</button>
			</div>
		</div>
	)
}

function formatRemaining(seconds: number): string {
	const min = Math.floor(seconds / 60)
	const sec = seconds % 60
	return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function resolveElapsedMinutes(durationSec: number, startedAt?: string): number {
	if (!startedAt) {
		return Math.max(1, Math.round(durationSec / 60))
	}
	const elapsedMs = Date.now() - new Date(startedAt).getTime()
	return Math.max(1, Math.round(elapsedMs / 60000))
}

function getInitialRemaining(durationSec: number, startedAt?: string): number {
	if (!startedAt) {
		return durationSec
	}
	const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
	return Math.max(0, durationSec - elapsed)
}

async function notifyTimerDone(): Promise<void> {
	if (typeof window === "undefined") {
		return
	}

	if ("vibrate" in navigator) {
		navigator.vibrate(250)
	}

	if ("Notification" in window && Notification.permission === "granted") {
		new Notification("Cronômetro finalizado", {
			body: "Bloco concluído. Pode avançar para o próximo.",
		})
	}

	try {
		const audioContext = new window.AudioContext()
		const oscillator = audioContext.createOscillator()
		const gain = audioContext.createGain()
		oscillator.type = "sine"
		oscillator.frequency.value = 880
		gain.gain.value = 0.05
		oscillator.connect(gain)
		gain.connect(audioContext.destination)
		oscillator.start()
		oscillator.stop(audioContext.currentTime + 0.2)
	} catch {
		return
	}
}
