export type HapticIntensity = "light" | "medium" | "strong"

export const HAPTIC_PATTERNS = {
	light: [50],
	medium: [100],
	strong: [50, 30, 100],
	celebration: [50, 30, 50, 30, 100],
} as const

export type HapticPattern = keyof typeof HAPTIC_PATTERNS

export function triggerHaptic(pattern: HapticPattern, intensity: HapticIntensity): void {
	if (!isHapticAvailable()) {
		return
	}

	const basePattern = HAPTIC_PATTERNS[pattern]
	const scaledPattern = scalePatternByIntensity(basePattern, intensity)

	try {
		void navigator.vibrate(scaledPattern)
	} catch {
		// Silently fail if vibration is not available
	}
}

export function isHapticAvailable(): boolean {
	if (typeof window === "undefined") {
		return false
	}

	return "vibrate" in navigator
}

function scalePatternByIntensity(pattern: readonly number[], intensity: HapticIntensity): number[] {
	const multiplier = {
		light: 0.5,
		medium: 1,
		strong: 1.5,
	}[intensity]

	return pattern.map((duration) => Math.round(duration * multiplier))
}
