/**
 * Creates a date key in "YYYY-MM-DD" format.
 *
 * This format is used throughout the app to identify days.
 * It makes it easy to compare and store dates as strings.
 *
 * @param date - The date to format (defaults to today)
 * @returns Date string in "YYYY-MM-DD" format
 *
 * @example
 * const today = getDateKey() // "2025-02-13"
 * const specific = getDateKey(new Date(2025, 1, 15)) // "2025-02-15"
 */
export function getDateKey(date = new Date()): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

/**
 * Gets the day of week from a date key.
 *
 * @param dateKey - Date string in "YYYY-MM-DD" format
 * @returns Day of week (0=Sunday, 6=Saturday)
 */
export function getWeekday(dateKey: string): number {
	const [year, month, day] = dateKey.split("-").map(Number)
	return new Date(year, month - 1, day).getDay()
}

/**
 * Creates a human-readable label for a date.
 *
 * Formats the date in Portuguese (pt-BR) style.
 * Shows weekday, day, month, and year.
 *
 * @param dateKey - Date string in "YYYY-MM-DD" format
 * @returns Formatted date string like "segunda, 13/02/2025"
 */
export function formatDateLabel(dateKey: string): string {
	const [year, month, day] = dateKey.split("-").map(Number)
	return new Intl.DateTimeFormat("pt-BR", {
		weekday: "long",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(year, month - 1, day))
}
