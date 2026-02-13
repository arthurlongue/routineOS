import { type HapticIntensity, triggerHaptic } from "@/lib/utils/haptics"
import type { SensorySettings } from "@/lib/utils/settings"
import { playSound, type SoundType } from "@/lib/utils/sounds"

export interface FeedbackOptions {
	settings: SensorySettings
	type: "completion" | "achievement" | "navigation"
}

export function triggerFeedback(options: FeedbackOptions): void {
	const { settings, type } = options

	// Trigger sound
	if (settings.soundEnabled) {
		const soundType = getSoundType(type, settings.completionSound)
		playSound(soundType, { volume: settings.soundVolume })
	}

	// Trigger haptic
	if (settings.hapticEnabled) {
		const pattern = getHapticPattern(type)
		triggerHaptic(pattern, settings.hapticIntensity as HapticIntensity)
	}
}

function getSoundType(
	feedbackType: FeedbackOptions["type"],
	completionSound: SensorySettings["completionSound"],
): SoundType {
	if (feedbackType === "completion") {
		return completionSound
	}

	if (feedbackType === "achievement") {
		return "chime"
	}

	return "pop"
}

function getHapticPattern(feedbackType: FeedbackOptions["type"]) {
	if (feedbackType === "achievement") {
		return "celebration"
	}

	return "medium"
}
