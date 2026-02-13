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
		<div className="card border border-base-300 bg-base-200/70 shadow-sm">
			<div className="card-body p-4">
				<div className="flex items-center justify-between text-base-content/80 text-sm">
					<p>
						{completed}/{total} completados
					</p>
					<p>{percent}% do dia</p>
				</div>
				<progress
					className="progress progress-primary mt-2 w-full"
					value={done}
					max={progressMax}
				/>
				<p className="text-base-content/60 text-xs">Pulos sem culpa: {skipped}</p>
			</div>
		</div>
	)
}
