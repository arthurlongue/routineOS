export type SoundType = "chime" | "bell" | "pop" | "none"

export interface SoundOptions {
	volume: number // 0-100
}

interface SoundConfig {
	frequency: number
	duration: number
	type: OscillatorType
}

const SOUND_CONFIGS: Record<Exclude<SoundType, "none">, SoundConfig> = {
	chime: { frequency: 880, duration: 0.3, type: "sine" },
	bell: { frequency: 523, duration: 0.5, type: "triangle" },
	pop: { frequency: 1200, duration: 0.1, type: "square" },
}

export function playSound(type: SoundType, options: SoundOptions): void {
	if (type === "none") {
		return
	}

	if (typeof window === "undefined") {
		return
	}

	const audioContext = createAudioContext()
	if (!audioContext) {
		return
	}

	const config = SOUND_CONFIGS[type]
	const gainValue = Math.max(0, Math.min(1, options.volume / 100)) * 0.15

	try {
		const oscillator = audioContext.createOscillator()
		const gain = audioContext.createGain()

		oscillator.type = config.type
		oscillator.frequency.value = config.frequency

		gain.gain.setValueAtTime(gainValue, audioContext.currentTime)
		gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration)

		oscillator.connect(gain)
		gain.connect(audioContext.destination)

		oscillator.start(audioContext.currentTime)
		oscillator.stop(audioContext.currentTime + config.duration)
	} catch {
		// Silently fail if audio context is not available
	}
}

function createAudioContext(): AudioContext | null {
	try {
		return new window.AudioContext()
	} catch {
		return null
	}
}
