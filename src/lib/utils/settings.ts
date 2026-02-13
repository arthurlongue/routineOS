export interface SensorySettings {
	// Sound preferences
	soundEnabled: boolean
	soundVolume: number // 0-100
	completionSound: "chime" | "bell" | "pop" | "none"

	// Haptic preferences
	hapticEnabled: boolean
	hapticIntensity: "light" | "medium" | "strong"

	// Animation preferences
	animationsEnabled: boolean
	animationSpeed: "slow" | "normal" | "fast"
	celebrationStyle: "confetti" | "particles" | "minimal" | "none"

	// Visual preferences
	colorTheme: "vibrant" | "muted" | "monochrome"
	highContrastMode: boolean
}

export interface AppSettings {
	// Existing
	askCompletionCheckIn: boolean
	showFeedbackOnHome: boolean

	// New
	sensory: SensorySettings
	defaultViewMode: "focus" | "overview"
	showOnboarding: boolean
	compactHeader: boolean
}

const SETTINGS_KEY = "routineos-settings-v1"

export const DEFAULT_SETTINGS: AppSettings = {
	askCompletionCheckIn: true,
	showFeedbackOnHome: true,
	sensory: {
		soundEnabled: false,
		soundVolume: 50,
		completionSound: "chime",
		hapticEnabled: true,
		hapticIntensity: "medium",
		animationsEnabled: true,
		animationSpeed: "normal",
		celebrationStyle: "particles",
		colorTheme: "vibrant",
		highContrastMode: false,
	},
	defaultViewMode: "focus",
	showOnboarding: true,
	compactHeader: false,
}

export function loadSettings(): AppSettings {
	if (typeof window === "undefined") {
		return DEFAULT_SETTINGS
	}

	try {
		const raw = window.localStorage.getItem(SETTINGS_KEY)
		if (!raw) {
			return DEFAULT_SETTINGS
		}

		const parsed = JSON.parse(raw) as Partial<AppSettings>
		return {
			askCompletionCheckIn: parsed.askCompletionCheckIn ?? DEFAULT_SETTINGS.askCompletionCheckIn,
			showFeedbackOnHome: parsed.showFeedbackOnHome ?? DEFAULT_SETTINGS.showFeedbackOnHome,
			sensory: {
				...DEFAULT_SETTINGS.sensory,
				...parsed.sensory,
			},
			defaultViewMode: parsed.defaultViewMode ?? DEFAULT_SETTINGS.defaultViewMode,
			showOnboarding: parsed.showOnboarding ?? DEFAULT_SETTINGS.showOnboarding,
			compactHeader: parsed.compactHeader ?? DEFAULT_SETTINGS.compactHeader,
		}
	} catch {
		return DEFAULT_SETTINGS
	}
}

export function saveSettings(settings: AppSettings): void {
	if (typeof window === "undefined") {
		return
	}

	window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
