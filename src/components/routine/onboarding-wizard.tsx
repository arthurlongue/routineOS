"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

interface OnboardingStep {
	icon: string
	title: string
	description: string
	primaryButton: string
	secondaryAction?: "settings"
}

interface OnboardingWizardProps {
	isOpen: boolean
	onComplete: () => void
	onSkip: () => void
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

export function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
	const [currentStep, setCurrentStep] = useState(0)
	const prefersReducedMotion = useReducedMotion()
	const router = useRouter()

	const step = ONBOARDING_STEPS[currentStep]
	const isLastStep = currentStep === ONBOARDING_STEPS.length - 1
	const isFirstStep = currentStep === 0

	const handleNext = useCallback(() => {
		if (isLastStep) {
			onComplete()
		} else {
			setCurrentStep((prev) => prev + 1)
		}
	}, [isLastStep, onComplete])

	const handlePrevious = useCallback(() => {
		if (!isFirstStep) {
			setCurrentStep((prev) => prev - 1)
		}
	}, [isFirstStep])

	const handleSettings = useCallback(() => {
		onComplete()
		router.push("/settings")
	}, [onComplete, router])

	const slideVariants = {
		enter: (direction: number) => ({
			x: prefersReducedMotion ? 0 : direction > 0 ? 300 : -300,
			opacity: 0,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (direction: number) => ({
			x: prefersReducedMotion ? 0 : direction > 0 ? -300 : 300,
			opacity: 0,
		}),
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
			<motion.div
				className="card relative mx-4 w-full max-w-md bg-base-100 shadow-xl"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
			>
				{/* Skip button */}
				<button
					type="button"
					className="btn btn-ghost btn-sm absolute top-4 right-4 text-base-content/60 hover:text-base-content"
					onClick={onSkip}
				>
					Pular
				</button>

				{/* Content */}
				<div className="card-body items-center pt-12 text-center">
					<AnimatePresence mode="wait" custom={1}>
						<motion.div
							key={currentStep}
							custom={1}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
							className="flex flex-col items-center"
						>
							<span className="mb-4 text-5xl">{step.icon}</span>
							<h2 className="card-title mb-2 text-xl">{step.title}</h2>
							<p className="text-base-content/70 text-sm leading-relaxed">{step.description}</p>
						</motion.div>
					</AnimatePresence>

					{/* Progress dots */}
					<div className="my-4 flex gap-2">
						{ONBOARDING_STEPS.map((stepItem, index) => (
							<button
								type="button"
								key={stepItem.title}
								className={`h-2 w-2 rounded-full transition-colors ${
									index === currentStep ? "bg-primary" : "bg-base-content/20"
								}`}
								onClick={() => setCurrentStep(index)}
								aria-label={`Ir para etapa ${index + 1}`}
							/>
						))}
					</div>

					{/* Buttons */}
					<div className="mt-2 flex gap-2">
						{!isFirstStep && (
							<button type="button" className="btn btn-ghost" onClick={handlePrevious}>
								Voltar
							</button>
						)}
						<button
							type="button"
							className="btn btn-primary"
							onClick={step.secondaryAction === "settings" ? handleSettings : handleNext}
						>
							{step.primaryButton}
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	)
}
