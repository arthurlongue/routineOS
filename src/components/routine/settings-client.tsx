"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { AppSettings } from "@/lib/utils/settings"
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/lib/utils/settings"

export function SettingsClient() {
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
	const [savedAt, setSavedAt] = useState<number | null>(null)

	useEffect(() => {
		setSettings(loadSettings())
	}, [])

	const updateSettings = (next: AppSettings) => {
		setSettings(next)
		saveSettings(next)
		setSavedAt(Date.now())
	}

	return (
		<div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-10 md:px-6">
			<header className="mb-5 flex items-center justify-between gap-3">
				<div>
					<p className="text-primary text-xs uppercase tracking-[0.2em]">RoutineOS</p>
					<h1 className="mt-1 font-semibold text-2xl text-base-content">Configurações</h1>
				</div>
				<Link href="/" className="btn btn-ghost btn-sm min-h-11">
					Voltar
				</Link>
			</header>

			<section className="card border border-base-300 bg-base-200/70 shadow-sm">
				<div className="card-body gap-4 p-4 md:p-5">
					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Perguntas rápidas ao concluir</p>
							<p className="text-base-content/70 text-xs">
								Mostra o check-in (humor, tempo e horário) após clicar em concluir.
							</p>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							checked={settings.askCompletionCheckIn}
							onChange={(event) =>
								updateSettings({
									...settings,
									askCompletionCheckIn: event.target.checked,
								})
							}
						/>
					</label>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Mostrar feedback na home</p>
							<p className="text-base-content/70 text-xs">
								Exibe o bloco colapsável de feedback diário na tela principal.
							</p>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							checked={settings.showFeedbackOnHome}
							onChange={(event) =>
								updateSettings({
									...settings,
									showFeedbackOnHome: event.target.checked,
								})
							}
						/>
					</label>

					{/* Sensory Preferences Section */}
					<h3 className="mt-6 mb-3 font-semibold text-lg">Sensibilidade Sensorial</h3>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Sons de conclusão</p>
							<p className="text-base-content/70 text-xs">Reproduz um som ao concluir um bloco.</p>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							checked={settings.sensory.soundEnabled}
							onChange={(event) =>
								updateSettings({
									...settings,
									sensory: {
										...settings.sensory,
										soundEnabled: event.target.checked,
									},
								})
							}
						/>
					</label>

					{settings.sensory.soundEnabled && (
						<>
							<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
								<div>
									<p className="font-medium text-sm">Volume</p>
									<p className="text-base-content/70 text-xs">Intensidade dos sons de conclusão.</p>
								</div>
								<div className="flex items-center gap-3">
									<input
										type="range"
										className="range range-primary range-sm w-32"
										min="0"
										max="100"
										value={settings.sensory.soundVolume}
										onChange={(event) =>
											updateSettings({
												...settings,
												sensory: {
													...settings.sensory,
													soundVolume: parseInt(event.target.value, 10),
												},
											})
										}
									/>
									<span className="w-10 text-right text-sm">{settings.sensory.soundVolume}%</span>
								</div>
							</label>

							<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
								<div>
									<p className="font-medium text-sm">Som de conclusão</p>
									<p className="text-base-content/70 text-xs">Tipo de som ao concluir um bloco.</p>
								</div>
								<select
									className="select select-primary select-sm w-36"
									value={settings.sensory.completionSound}
									onChange={(event) =>
										updateSettings({
											...settings,
											sensory: {
												...settings.sensory,
												completionSound: event.target.value as "chime" | "bell" | "pop" | "none",
											},
										})
									}
								>
									<option value="chime">Tilintar</option>
									<option value="bell">Sino</option>
									<option value="pop">Pop</option>
									<option value="none">Nenhum</option>
								</select>
							</label>
						</>
					)}

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Vibração</p>
							<p className="text-base-content/70 text-xs">
								Vibração ao concluir um bloco (se disponível).
							</p>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							checked={settings.sensory.hapticEnabled}
							onChange={(event) =>
								updateSettings({
									...settings,
									sensory: {
										...settings.sensory,
										hapticEnabled: event.target.checked,
									},
								})
							}
						/>
					</label>

					{settings.sensory.hapticEnabled && (
						<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
							<div>
								<p className="font-medium text-sm">Intensidade da vibração</p>
								<p className="text-base-content/70 text-xs">Força da vibração ao concluir.</p>
							</div>
							<select
								className="select select-primary select-sm w-28"
								value={settings.sensory.hapticIntensity}
								onChange={(event) =>
									updateSettings({
										...settings,
										sensory: {
											...settings.sensory,
											hapticIntensity: event.target.value as "light" | "medium" | "strong",
										},
									})
								}
							>
								<option value="light">Leve</option>
								<option value="medium">Média</option>
								<option value="strong">Forte</option>
							</select>
						</label>
					)}

					{/* Animations Section */}
					<h3 className="mt-6 mb-3 font-semibold text-lg">Animações</h3>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Animações ativadas</p>
							<p className="text-base-content/70 text-xs">
								Habilita animações de transição e interação.
							</p>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							checked={settings.sensory.animationsEnabled}
							onChange={(event) =>
								updateSettings({
									...settings,
									sensory: {
										...settings.sensory,
										animationsEnabled: event.target.checked,
									},
								})
							}
						/>
					</label>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Velocidade</p>
							<p className="text-base-content/70 text-xs">Velocidade das animações.</p>
						</div>
						<select
							className="select select-primary select-sm w-28"
							value={settings.sensory.animationSpeed}
							onChange={(event) =>
								updateSettings({
									...settings,
									sensory: {
										...settings.sensory,
										animationSpeed: event.target.value as "slow" | "normal" | "fast",
									},
								})
							}
						>
							<option value="slow">Lenta</option>
							<option value="normal">Normal</option>
							<option value="fast">Rápida</option>
						</select>
					</label>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Estilo de celebração</p>
							<p className="text-base-content/70 text-xs">Efeito visual ao concluir um bloco.</p>
						</div>
						<select
							className="select select-primary select-sm w-32"
							value={settings.sensory.celebrationStyle}
							onChange={(event) =>
								updateSettings({
									...settings,
									sensory: {
										...settings.sensory,
										celebrationStyle: event.target.value as
											| "confetti"
											| "particles"
											| "minimal"
											| "none",
									},
								})
							}
						>
							<option value="confetti">Confete</option>
							<option value="particles">Partículas</option>
							<option value="minimal">Minimalista</option>
							<option value="none">Nenhuma</option>
						</select>
					</label>

					{/* View Preferences Section */}
					<h3 className="mt-6 mb-3 font-semibold text-lg">Preferências de Visualização</h3>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Modo padrão</p>
							<p className="text-base-content/70 text-xs">Modo de visualização inicial da home.</p>
						</div>
						<select
							className="select select-primary select-sm w-32"
							value={settings.defaultViewMode}
							onChange={(event) =>
								updateSettings({
									...settings,
									defaultViewMode: event.target.value as "focus" | "overview",
								})
							}
						>
							<option value="focus">Foco</option>
							<option value="overview">Visão geral</option>
						</select>
					</label>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Cabeçalho compacto</p>
							<p className="text-base-content/70 text-xs">Reduz o tamanho do cabeçalho na home.</p>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							checked={settings.compactHeader}
							onChange={(event) =>
								updateSettings({
									...settings,
									compactHeader: event.target.checked,
								})
							}
						/>
					</label>

					<label className="label cursor-pointer justify-between gap-3 rounded-box border border-base-300 bg-base-100/60 px-3 py-3">
						<div>
							<p className="font-medium text-sm">Alto contraste</p>
							<p className="text-base-content/70 text-xs">
								Aumenta o contraste de cores para melhor legibilidade.
							</p>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							checked={settings.sensory.highContrastMode}
							onChange={(event) =>
								updateSettings({
									...settings,
									sensory: {
										...settings.sensory,
										highContrastMode: event.target.checked,
									},
								})
							}
						/>
					</label>

					<p className="text-base-content/65 text-xs">
						{savedAt
							? "Configurações salvas automaticamente."
							: "As alterações salvam automaticamente."}
					</p>
				</div>
			</section>
		</div>
	)
}
