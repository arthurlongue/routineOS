const ONBOARDED_KEY = "routineos-onboarded-v1"

/**
 * Check if this is the user's first time using the app.
 * Returns true if the user has not completed onboarding.
 */
export function isFirstRun(): boolean {
	if (typeof window === "undefined") {
		return false
	}

	return window.localStorage.getItem(ONBOARDED_KEY) !== "true"
}

/**
 * Mark the user as onboarded.
 * Call when the wizard completes or is skipped.
 */
export function markOnboarded(): void {
	if (typeof window === "undefined") {
		return
	}

	window.localStorage.setItem(ONBOARDED_KEY, "true")
}

/**
 * Reset onboarding state.
 * Useful for testing or user-requested reset.
 */
export function resetOnboarding(): void {
	if (typeof window === "undefined") {
		return
	}

	window.localStorage.removeItem(ONBOARDED_KEY)
}
