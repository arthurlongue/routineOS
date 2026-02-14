"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useCallback, useState } from "react"

interface OnboardingStep {
	icon: string
	title: string
	description: string
	primaryButton: string
	secondaryAction?: "settings"
}

const ONBOARDING_STEPS: OnboardingStep[] = [
	{
		icon: " targeting",
		title: "Bem-vindo ao RoutineOS",
		description:
			"Um app de rotinas pensado para pessoas com TDAH. Uma tarefa de cada vez, sem fricção.",
		primaryButton: "Começar",
	},
	{
		icon: " targeting",
		title: "Foque em uma coisa só",
		description: "O Modo Foco mostra apenas uma tarefa por vez. Menos distração, mais clareza.",
		primaryButton: "Entendi",
	},
	{
		icon: " settings",
		title: "Personalize sua experiência",
		description:
			"Ative ou desative sons, vibrações e animações nas Configurações. Você está no controle.",
		primaryButton: "Continuar",
		secondaryAction: "settings",
	},
	{
		icon: " rocket",
		title: "Tudo pronto!",
		description: "Sua primeira tarefa está esperando. Clique em 'Concluir' quando terminar.",
		primaryButton: "Começar agora",
	},
]

interface OnboardingWizardProps {
	isOpen: boolean
	onComplete: () => void
	onSkip: () => void
	onGoToSettings?: () => void
}

export function OnboardingWizard({
	isOpen,
	onComplete,
	onSkip,
	onGoToSettings,
}: OnboardingWizardProps) {
	const [currentStep, setCurrentStep] = useState(0)
	const [direction, setDirection] = useState(0)
	const shouldReduceMotion = useReducedMotion()

	const step = ONBOARDING_STEPS[currentStep]
	const isLastStep = currentStep === ONBOARDING_STEPS.length - 1
	const isFirstStep = currentStep === 0

	const paginate = useCallback(
		(newDirection: number) => {
			if (newDirection > 0 && isLastStep) {
				onComplete()
			} else if (newDirection > 0) {
				setDirection(1)
				setCurrentStep((prev) => prev + 1)
			} else if (newDirection < 0 && !isFirstStep) {
				setDirection(-1)
				setCurrentStep((prev) => prev - 1)
			}
		},
		[isFirstStep, isLastStep, onComplete],
	)

	const handleSettings = useCallback(() => {
		if (onGoToSettings) {
			onGoToSettings()
		}
		onComplete()
	}, [onGoToSettings, onComplete])

	const slideVariants = {
		enter: (dir: number) => ({
			x: shouldReduceMotion ? 0 : dir > 0 ? 300 : -300,
			opacity: shouldReduceMotion ? 0 : 1,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (dir: number) => ({
			x: shouldReduceMotion ? 0 : dir < 0 ? 300 : -300,
			opacity: shouldReduceMotion ? 0 : 1,
		}),
	}

	if (!isOpen) {
		return null
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
			<motion.div
				initial={shouldReduceMotion ? {} : { scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={shouldReduceMotion ? {} : { scale: 0.95, opacity: 0 }}
				className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-2xl"
			>
				{/* Skip button */}
				<button
					type="button"
					onClick={onSkip}
					className="btn btn-ghost btn-sm absolute right-3 top-3 z-10 rounded-full text-base-content/60 hover:text-base-content"
				>
					Pular
				</button>

				{/* Content */}
				<div className="overflow-hidden p-6 pt-12">
					<AnimatePresence initial={false} custom={direction} mode="wait">
						<motion.div
							key={currentStep}
							custom={direction}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.3, ease: "easeInOut" }}
							className="text-center"
						>
							<div className="mb-4 text-6xl">{step.icon}</div>
							<h2 className="mb-3 font-semibold text-2xl text-base-content">{step.title}</h2>
							<p className="text-base-content/70 leading-relaxed">{step.description}</p>
						</motion.div>
					</AnimatePresence>
				</div>

				{/* Progress dots */}
				<div className="flex justify-center gap-2 pb-4">
					{ONBOARDING_STEPS.map((stepItem, index) => (
						<button
							type="button"
							key={stepItem.title}
							onClick={() => {
								setDirection(index > currentStep ? 1 : -1)
								setCurrentStep(index)
							}}
							className={`h-2 rounded-full transition-all ${
								index === currentStep
									? "w-6 bg-primary"
									: "w-2 bg-base-content/30 hover:bg-base-content/50"
							}`}
							aria-label={`Ir para passo ${index + 1}`}
						/>
					))}
				</div>

				{/* Navigation buttons */}
				<div className="flex gap-3 p-6 pt-2">
					{!isFirstStep && (
						<button
							type="button"
							onClick={() => paginate(-1)}
							className="btn btn-outline btn-sm flex-1 rounded-xl"
						>
							Anterior
						</button>
					)}
					<button
						type="button"
						onClick={() => paginate(1)}
						className="btn btn-primary btn-sm flex-1 rounded-xl"
					>
						{step.primaryButton}
					</button>
					{step.secondaryAction === "settings" && (
						<button
							type="button"
							onClick={handleSettings}
							className="btn btn-ghost btn-sm rounded-xl"
						>
							Configurar
						</button>
					)}
				</div>
			</motion.div>
		</div>
	}
