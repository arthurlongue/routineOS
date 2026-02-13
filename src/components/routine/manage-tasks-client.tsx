"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { createBlock, deleteBlock, listBlocks, moveBlock, updateBlock } from "@/lib/db/queries"
import { BLOCK_CATEGORIES, type Block, type BlockCategory } from "@/lib/types"

interface FormState {
	slug: string
	label: string
	icon: string
	color: string
	category: BlockCategory
	defaultDurationMin: number
	daysOfWeek: number[]
	isAnchor: boolean
	anchorTime: string
	isSkippable: boolean
	cutPriority: number
}

const WEEK_DAYS = [
	{ value: 0, label: "Dom" },
	{ value: 1, label: "Seg" },
	{ value: 2, label: "Ter" },
	{ value: 3, label: "Qua" },
	{ value: 4, label: "Qui" },
	{ value: 5, label: "Sex" },
	{ value: 6, label: "Sab" },
] as const

const DEFAULT_FORM: FormState = {
	slug: "",
	label: "",
	icon: "✅",
	color: "#22d3ee",
	category: "sequence",
	defaultDurationMin: 30,
	daysOfWeek: [1, 2, 3, 4, 5],
	isAnchor: false,
	anchorTime: "06:00",
	isSkippable: true,
	cutPriority: 5,
}

export function ManageTasksClient() {
	const router = useRouter()
	const [blocks, setBlocks] = useState<Block[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [form, setForm] = useState<FormState>(DEFAULT_FORM)
	const [error, setError] = useState<string | null>(null)

	const selectedBlock = useMemo(
		() => blocks.find((block) => block.id === selectedId) ?? null,
		[blocks, selectedId],
	)

	const loadBlocks = useCallback(async () => {
		try {
			const allBlocks = await listBlocks()
			setBlocks(allBlocks)
			setError(null)
		} catch {
			setError("Não foi possível carregar as tarefas")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadBlocks()
	}, [loadBlocks])

	const onEdit = useCallback((block: Block) => {
		setSelectedId(block.id)
		setForm({
			slug: block.slug,
			label: block.label,
			icon: block.icon,
			color: block.color,
			category: block.category,
			defaultDurationMin: block.defaultDurationMin,
			daysOfWeek: block.daysOfWeek,
			isAnchor: block.isAnchor,
			anchorTime: block.anchorTime ?? "06:00",
			isSkippable: block.isSkippable,
			cutPriority: block.cutPriority,
		})
	}, [])

	useEffect(() => {
		if (typeof window === "undefined") {
			return
		}

		const targetEditId = new URLSearchParams(window.location.search).get("edit")
		if (!targetEditId) {
			return
		}

		const block = blocks.find((candidate) => candidate.id === targetEditId)
		if (!block) {
			return
		}

		onEdit(block)
		router.replace("/tasks")
	}, [blocks, onEdit, router])

	const resetForm = useCallback(() => {
		setSelectedId(null)
		setForm(DEFAULT_FORM)
	}, [])

	const toggleDay = useCallback((day: number) => {
		setForm((current) => {
			const exists = current.daysOfWeek.includes(day)
			if (exists) {
				return {
					...current,
					daysOfWeek: current.daysOfWeek.filter((currentDay) => currentDay !== day),
				}
			}
			return {
				...current,
				daysOfWeek: [...current.daysOfWeek, day].sort((a, b) => a - b),
			}
		})
	}, [])

	const onSubmit = useCallback(async () => {
		if (!form.label.trim()) {
			setError("Informe um nome para a tarefa")
			return
		}
		if (form.daysOfWeek.length === 0) {
			setError("Selecione ao menos um dia da semana")
			return
		}

		setSaving(true)
		try {
			if (selectedBlock) {
				await updateBlock(selectedBlock.id, form)
			} else {
				await createBlock(form)
			}
			await loadBlocks()
			resetForm()
			setError(null)
		} catch {
			setError("Não foi possível salvar a tarefa")
		} finally {
			setSaving(false)
		}
	}, [form, loadBlocks, resetForm, selectedBlock])

	const onDelete = useCallback(
		async (block: Block) => {
			if (!window.confirm(`Excluir "${block.label}"?`)) {
				return
			}
			try {
				await deleteBlock(block.id)
				if (selectedId === block.id) {
					resetForm()
				}
				await loadBlocks()
			} catch {
				setError("Não foi possível excluir a tarefa")
			}
		},
		[loadBlocks, resetForm, selectedId],
	)

	const onMove = useCallback(
		async (blockId: string, direction: "up" | "down") => {
			try {
				await moveBlock(blockId, direction)
				await loadBlocks()
			} catch {
				setError("Não foi possível reordenar")
			}
		},
		[loadBlocks],
	)

	return (
		<div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-10 md:px-6">
			<header className="mb-5 flex items-center justify-between gap-3">
				<div>
					<p className="text-primary text-xs uppercase tracking-[0.2em]">RoutineOS</p>
					<h1 className="mt-1 font-semibold text-2xl text-base-content">Gerenciar tarefas</h1>
				</div>
				<Link href="/" className="btn btn-ghost btn-sm min-h-11">
					Voltar
				</Link>
			</header>

			{error ? (
				<div className="alert alert-error mb-4">
					<p>{error}</p>
				</div>
			) : null}

			<section className="card border border-base-300 bg-base-200/70 shadow-sm">
				<div className="card-body gap-4 p-4 md:p-5">
					<div className="flex items-center justify-between gap-3">
						<h2 className="font-semibold text-base-content text-lg">
							{selectedBlock ? "Editar tarefa" : "Nova tarefa"}
						</h2>
						{selectedBlock ? (
							<button type="button" onClick={resetForm} className="btn btn-ghost btn-sm min-h-11">
								Nova
							</button>
						) : null}
					</div>

					<div className="flex flex-wrap gap-3">
						<label className="form-control w-full md:w-[46%]">
							<span className="label-text text-sm">Nome</span>
							<input
								className="input input-bordered w-full"
								value={form.label}
								onChange={(event) =>
									setForm((current) => ({ ...current, label: event.target.value }))
								}
								placeholder="Ex: Trabalho focado 3"
							/>
						</label>

						<label className="form-control w-full md:w-[22%]">
							<span className="label-text text-sm">Ícone</span>
							<input
								className="input input-bordered w-full"
								value={form.icon}
								onChange={(event) =>
									setForm((current) => ({ ...current, icon: event.target.value }))
								}
								maxLength={8}
							/>
						</label>

						<label className="form-control w-full md:w-[22%]">
							<span className="label-text text-sm">Cor</span>
							<input
								className="input input-bordered w-full"
								value={form.color}
								onChange={(event) =>
									setForm((current) => ({ ...current, color: event.target.value }))
								}
								placeholder="#22d3ee"
							/>
						</label>

						<label className="form-control w-full md:w-[30%]">
							<span className="label-text text-sm">Slug</span>
							<input
								className="input input-bordered w-full"
								value={form.slug}
								onChange={(event) =>
									setForm((current) => ({ ...current, slug: event.target.value }))
								}
								placeholder="deep-work-3"
							/>
						</label>

						<label className="form-control w-full md:w-[30%]">
							<span className="label-text text-sm">Categoria</span>
							<select
								className="select select-bordered w-full"
								value={form.category}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										category: event.target.value as BlockCategory,
									}))
								}
							>
								{BLOCK_CATEGORIES.map((category) => (
									<option key={category} value={category}>
										{formatCategoryLabel(category)}
									</option>
								))}
							</select>
						</label>

						<label className="form-control w-full md:w-[16%]">
							<span className="label-text text-sm">Duração (min)</span>
							<input
								className="input input-bordered w-full"
								type="number"
								min={0}
								value={form.defaultDurationMin}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										defaultDurationMin: Number(event.target.value),
									}))
								}
							/>
						</label>

						<label className="form-control w-full md:w-[16%]">
							<span className="label-text text-sm">Prioridade corte</span>
							<input
								className="input input-bordered w-full"
								type="number"
								min={1}
								max={99}
								value={form.cutPriority}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										cutPriority: Number(event.target.value),
									}))
								}
							/>
						</label>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{WEEK_DAYS.map((day) => (
							<button
								type="button"
								key={day.value}
								onClick={() => toggleDay(day.value)}
								className={`btn btn-sm min-h-10 ${
									form.daysOfWeek.includes(day.value) ? "btn-primary" : "btn-outline"
								}`}
							>
								{day.label}
							</button>
						))}
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<label className="label cursor-pointer gap-2">
							<input
								type="checkbox"
								className="toggle toggle-primary"
								checked={form.isSkippable}
								onChange={(event) =>
									setForm((current) => ({ ...current, isSkippable: event.target.checked }))
								}
							/>
							<span className="label-text">Pode pular</span>
						</label>

						<label className="label cursor-pointer gap-2">
							<input
								type="checkbox"
								className="toggle toggle-info"
								checked={form.isAnchor}
								onChange={(event) =>
									setForm((current) => ({ ...current, isAnchor: event.target.checked }))
								}
							/>
							<span className="label-text">Tarefa âncora</span>
						</label>

						<label className="form-control w-full md:w-48">
							<span className="label-text text-sm">Hora âncora</span>
							<input
								type="time"
								className="input input-bordered w-full"
								disabled={!form.isAnchor}
								value={form.anchorTime}
								onChange={(event) =>
									setForm((current) => ({ ...current, anchorTime: event.target.value }))
								}
							/>
						</label>
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => void onSubmit()}
							disabled={saving}
							className="btn btn-primary"
						>
							{selectedBlock ? "Salvar alterações" : "Criar tarefa"}
						</button>
						{selectedBlock ? (
							<button type="button" onClick={resetForm} className="btn btn-ghost">
								Cancelar
							</button>
						) : null}
					</div>
				</div>
			</section>

			<section className="mt-5">
				<h2 className="mb-3 font-semibold text-base-content text-lg">Tarefas ({blocks.length})</h2>

				{loading ? (
					<div className="card border border-base-300 bg-base-200/70 p-4 text-base-content/70">
						Carregando...
					</div>
				) : (
					<div className="space-y-2">
						{blocks.map((block) => (
							<article
								key={block.id}
								className="card border border-base-300 bg-base-200/70 shadow-sm"
							>
								<div className="card-body p-4">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p className="font-semibold text-base-content text-lg">
												{block.icon} {block.label}
											</p>
											<p className="text-base-content/60 text-sm">
												{block.slug} | {block.defaultDurationMin} min | ordem {block.order}
											</p>
											<p className="mt-1 text-base-content/70 text-sm">
												Dias: {formatDays(block.daysOfWeek)}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											<button
												type="button"
												onClick={() => void onMove(block.id, "up")}
												className="btn btn-outline btn-sm min-h-11"
											>
												Subir
											</button>
											<button
												type="button"
												onClick={() => void onMove(block.id, "down")}
												className="btn btn-outline btn-sm min-h-11"
											>
												Descer
											</button>
											<button
												type="button"
												onClick={() => onEdit(block)}
												className="btn btn-info btn-sm min-h-11"
											>
												Editar
											</button>
											<button
												type="button"
												onClick={() => void onDelete(block)}
												className="btn btn-error btn-sm min-h-11"
											>
												Excluir
											</button>
										</div>
									</div>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	)
}

function formatDays(days: number[]): string {
	return WEEK_DAYS.filter((day) => days.includes(day.value))
		.map((day) => day.label)
		.join(", ")
}

function formatCategoryLabel(category: BlockCategory): string {
	if (category === "anchor") {
		return "Âncora"
	}
	if (category === "sequence") {
		return "Sequência"
	}
	return "Flexível"
}
