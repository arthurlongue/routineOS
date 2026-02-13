"use client"

interface TimeProgressProps {
	label: string
	percentage: number
	color: string
	size?: number
}

/**
 * Build an SVG arc path for a pie wedge from 12 o'clock, sweeping clockwise.
 */
function buildWedgePath(cx: number, cy: number, r: number, percentage: number): string {
	if (percentage <= 0) return ""
	if (percentage >= 100) {
		return `M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0 Z`
	}

	const angle = (percentage / 100) * 360
	const rad = ((angle - 90) * Math.PI) / 180
	const startX = cx
	const startY = cy - r
	const endX = cx + r * Math.cos(rad)
	const endY = cy + r * Math.sin(rad)
	const largeArc = angle > 180 ? 1 : 0

	return `M ${cx},${cy} L ${startX},${startY} A ${r},${r} 0 ${largeArc},1 ${endX},${endY} Z`
}

export function TimeProgress({ label, percentage, color, size = 56 }: TimeProgressProps) {
	const clampedPercentage = Math.min(100, Math.max(0, percentage))
	const center = size / 2
	const radius = size / 2 - 2

	return (
		<div className="flex flex-col items-center gap-1">
			<div className="relative flex items-center justify-center">
				<svg width={size} height={size} aria-hidden="true">
					{/* Clock face background */}
					<circle
						cx={center}
						cy={center}
						r={radius}
						className="fill-base-100/90"
						stroke="currentColor"
						strokeWidth={1.5}
						style={{ stroke: `${color}40` }}
					/>

					{/* Filled pie wedge — elapsed portion */}
					<path
						d={buildWedgePath(center, center, radius, clampedPercentage)}
						fill={color}
						opacity={0.8}
					/>

					{/* Outer ring for definition */}
					<circle
						cx={center}
						cy={center}
						r={radius}
						fill="none"
						stroke={color}
						strokeWidth={1}
						opacity={0.5}
					/>
				</svg>

				{/* Center percentage — high contrast with text shadow */}
				<span
					className="absolute inset-0 flex items-center justify-center font-bold text-base-content tabular-nums"
					style={{
						fontSize: `${Math.max(10, size * 0.22)}px`,
						textShadow: "0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)",
					}}
				>
					{percentage.toFixed(0)}%
				</span>
			</div>

			<span
				className="font-semibold text-base-content/50 uppercase tracking-wider"
				style={{ fontSize: `${Math.max(8, size * 0.15)}px` }}
			>
				{label}
			</span>
		</div>
	)
}
