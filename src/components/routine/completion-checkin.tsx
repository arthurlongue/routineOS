"use client"

import { useEffect, useState } from "react"

import type { CompletionCheckIn as CompletionCheckInValue } from "@/lib/utils/completion-checkin"

interface CompletionCheckInProps {
	isOpen: boolean
	taskLabel: string
	onCancel: () => void
	onSubmit: (checkIn: CompletionCheckInValue) => void
}

interface FrictionState {
	timeMismatch: boolean
	startedLate: boolean
	endedLate: boolean
}

const DEFAULT_FRICTION: FrictionState = {
	timeMismatch: false,
	startedLate: false,
	endedLate: false,
}

export function CompletionCheckIn({
	isOpen,
	taskLabel,
	onCancel,
	onSubmit,
}: CompletionCheckInProps) {
	const [showDetails, setShowDetails] = useState(false)
	const [friction, setFriction] = useState<FrictionState>(DEFAULT_FRICTION)

	useEffect(() => {
		if (!isOpen) {
			return
		}
		setShowDetails(false)
		setFriction(DEFAULT_FRICTION)
	}, [isOpen])

	if (!isOpen) {
		return null
	}

	return (
		<div className="fixed inset-0 z-40 flex items-end bg-base-content/55 p-3 md:items-center md:justify-center">
			<div className="w-full max-w-md rounded-3xl border border-base-300 bg-base-100 shadow-2xl">
				<div className="border-base-300 border-b px-4 py-3">
					<p className="text-primary text-xs uppercase tracking-[0.2em]">Check-in relâmpago</p>
					<h2 className="mt-1 font-semibold text-base-content text-lg">Como foi essa tarefa?</h2>
					<p className="truncate text-base-content/70 text-sm">{taskLabel}</p>
				</div>

				<div className="space-y-3 px-4 py-4">
					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							onClick={() =>
								onSubmit({
									mood: "up",
									timeWasCorrect: true,
									startedOnTime: true,
									endedOnTime: true,
								})
							}
							className="btn btn-success min-h-16 rounded-2xl text-base"
						>
							👍 Foi de boa
						</button>
						<button
							type="button"
							onClick={() =>
								onSubmit({
									mood: "down",
									timeWasCorrect: true,
									startedOnTime: true,
									endedOnTime: true,
								})
							}
							className="btn btn-outline btn-error min-h-16 rounded-2xl text-base"
						>
							👎 Foi difícil
						</button>
					</div>

					<div className="rounded-2xl border border-base-300 bg-base-200/50 p-3">
						<div className="flex items-center justify-between gap-2">
							<p className="font-medium text-sm">Se quiser, marca o que travou</p>
							<button
								type="button"
								onClick={() => setShowDetails((current) => !current)}
								className="btn btn-ghost btn-xs"
							>
								{showDetails ? "Ocultar" : "Mostrar"}
							</button>
						</div>

						{showDetails ? (
							<>
								<div className="mt-2 flex flex-wrap gap-2">
									<ToggleChip
										label="Tempo mal estimado"
										active={friction.timeMismatch}
										onClick={() =>
											setFriction((current) => ({
												...current,
												timeMismatch: !current.timeMismatch,
											}))
										}
									/>
									<ToggleChip
										label="Comecei atrasado"
										active={friction.startedLate}
										onClick={() =>
											setFriction((current) => ({
												...current,
												startedLate: !current.startedLate,
											}))
										}
									/>
									<ToggleChip
										label="Terminei atrasado"
										active={friction.endedLate}
										onClick={() =>
											setFriction((current) => ({
												...current,
												endedLate: !current.endedLate,
											}))
										}
									/>
								</div>
								<button
									type="button"
									onClick={() =>
										onSubmit({
											mood: "down",
											timeWasCorrect: !friction.timeMismatch,
											startedOnTime: !friction.startedLate,
											endedOnTime: !friction.endedLate,
										})
									}
									className="btn btn-primary btn-sm mt-3 w-full"
								>
									Salvar detalhes e concluir
								</button>
							</>
						) : null}
					</div>
				</div>

				<div className="flex justify-end border-base-300 border-t px-4 py-3">
					<button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
						Pular check-in
					</button>
				</div>
			</div>
		</div>
	)
}

interface ToggleChipProps {
	label: string
	active: boolean
	onClick: () => void
}

function ToggleChip({ label, active, onClick }: ToggleChipProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`badge h-9 rounded-full px-3 text-xs ${
				active ? "badge-error badge-outline" : "badge-ghost"
			}`}
		>
			{label}
		</button>
	)
}
