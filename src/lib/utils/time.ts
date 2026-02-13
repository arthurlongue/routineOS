/**
 * Converts a time string like "09:30" to minutes since midnight.
 *
 * @param clock - Time in "HH:MM" format (24-hour clock)
 * @returns Total minutes since midnight (e.g., "09:30" → 570)
 */
export function parseClockToMinutes(clock: string): number {
	const [hoursPart, minutesPart] = clock.split(":")
	const hours = Number(hoursPart)
	const minutes = Number(minutesPart)
	return hours * 60 + minutes
}

/**
 * Converts minutes since midnight to a time string.
 *
 * Handles times that go past midnight by wrapping around.
 * For example, 1500 minutes becomes "01:00" (next day).
 *
 * @param totalMinutes - Minutes since midnight
 * @returns Time in "HH:MM" format (24-hour clock)
 */
export function minutesToClock(totalMinutes: number): string {
	const normalized = ((totalMinutes % 1440) + 1440) % 1440
	const hours = Math.floor(normalized / 60)
	const minutes = normalized % 60
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/**
 * Adds minutes to a time string.
 *
 * @param clock - Starting time in "HH:MM" format
 * @param minutesToAdd - Minutes to add (can be negative)
 * @returns New time in "HH:MM" format
 */
export function addMinutes(clock: string, minutesToAdd: number): string {
	const start = parseClockToMinutes(clock)
	return minutesToClock(start + minutesToAdd)
}

/**
 * Calculates minutes between two ISO date strings.
 *
 * Returns at least 1 minute even if times are very close.
 * This prevents division by zero in progress calculations.
 *
 * @param fromIso - Start time in ISO format
 * @param toIso - End time in ISO format
 * @returns Whole minutes between the two times (minimum 1)
 */
export function diffMinutes(fromIso: string, toIso: string): number {
	const from = new Date(fromIso).getTime()
	const to = new Date(toIso).getTime()
	const ms = Math.max(0, to - from)
	return Math.max(1, Math.round(ms / 60000))
}
