interface ProgressBarProps {
	completed: number
	total: number
	skipped: number
}

export function ProgressBar({ completed, total, skipped }: ProgressBarProps) {
	const done = completed + skipped
	const percent = total === 0 ? 0 : Math.round((done / total) * 100)
	const progressMax = total === 0 ? 1 : total

	return (
		<div className="flex items-center gap-4">
			<div className="flex-1">
				<progress
					className="progress progress-primary w-full [&::-webkit-progress-bar]:h-2.5 [&::-webkit-progress-bar]:rounded-full"
					value={done}
					max={progressMax}
				/>
			</div>
			<div className="flex items-center gap-3 text-base-content/70 text-xs">
				<span className="tabular-nums">
					{completed}/{total}
				</span>
				<span className="text-base-content/40">·</span>
				<span className="tabular-nums">{percent}%</span>
				{skipped > 0 && (
					<>
						<span className="text-base-content/40">·</span>
						<span className="text-base-content/50">{skipped} pulos</span>
					</>
				)}
			</div>
		</div>
	)
}
