"use client"

import { motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { TimeProgress } from "@/components/routine/time-progress"
import { getAllTimeProgress } from "@/lib/utils/time-progress"

const TIME_ITEMS = [
	{ key: "year", label: "Ano", color: "#22d3ee" },
	{ key: "month", label: "Mês", color: "#a78bfa" },
	{ key: "week", label: "Semana", color: "#fbbf24" },
	{ key: "day", label: "Dia", color: "#34d399" },
] as const

const STORAGE_KEY = "routineos-time-widget"

export function TimeDashboard({ now }: { now: Date }) {
	const [collapsed, setCollapsed] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		if (typeof window === "undefined") return
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			if (raw) {
				const parsed = JSON.parse(raw) as { collapsed?: boolean }
				setCollapsed(parsed.collapsed ?? false)
			}
		} catch {
			/* ignore */
		}
		setMounted(true)
	}, [])

	const progress = getAllTimeProgress(now)

	const handleToggle = useCallback(() => {
		setCollapsed((prev) => {
			const next = !prev
			if (typeof window !== "undefined") {
				localStorage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: next }))
			}
			return next
		})
	}, [])

	if (!mounted) return null

	return (
		<section className="mb-3">
			<button
				type="button"
				onClick={handleToggle}
				className="mb-2 flex items-center gap-1.5 text-base-content/50 transition-colors hover:text-base-content/70"
			>
				<span className="text-xs">⏱</span>
				<span className="font-medium text-[10px] uppercase tracking-wider">Tempo</span>
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>

			{!collapsed && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="overflow-hidden"
				>
					<div className="flex items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-200/50 px-4 py-3">
						{TIME_ITEMS.map((item) => (
							<TimeProgress
								key={item.key}
								label={item.label}
								percentage={progress[item.key]}
								color={item.color}
								size={44}
							/>
						))}
					</div>
				</motion.div>
			)}
		</section>
	)
}
