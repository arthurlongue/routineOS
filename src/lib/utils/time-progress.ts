/**
 * Result showing how much time has passed in a period.
 *
 * @param percentage - Percent of the period that has elapsed (0-100)
 */
export interface TimeProgressResult {
	percentage: number
}

function getStartOfYear(date: Date): Date {
	return new Date(date.getFullYear(), 0, 1)
}

function getEndOfYear(date: Date): Date {
	return new Date(date.getFullYear() + 1, 0, 1)
}

function getStartOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function getStartOfWeek(date: Date): Date {
	const d = new Date(date)
	const day = d.getDay()
	d.setDate(d.getDate() - day)
	d.setHours(0, 0, 0, 0)
	return d
}

function getStartOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function calculatePercentage(elapsedMs: number, totalMs: number): number {
	if (totalMs === 0) return 0
	return Math.round((elapsedMs / totalMs) * 100 * 10) / 10
}

type Period = "year" | "month" | "week" | "day"

/**
 * Consolidated function to get time progress for any period.
 *
 * @param now - Current date/time (defaults to now)
 * @param period - Time period to calculate progress for
 * @returns Percentage of the period that has elapsed (0-100)
 */
function getTimeProgress(now: Date = new Date(), period: Period): number {
	const startOfDay = getStartOfDay(now)

	switch (period) {
		case "year": {
			const startOfYear = getStartOfYear(now)
			const endOfYear = getEndOfYear(now)
			const elapsedMs = now.getTime() - startOfYear.getTime()
			const totalMs = endOfYear.getTime() - startOfYear.getTime()
			return calculatePercentage(elapsedMs, totalMs)
		}
		case "month": {
			const startOfMonth = getStartOfMonth(now)
			const endOfMonth = getEndOfMonth(now)
			const elapsedMs = now.getTime() - startOfMonth.getTime()
			const totalMs = endOfMonth.getTime() - startOfMonth.getTime()
			return calculatePercentage(elapsedMs, totalMs)
		}
		case "week": {
			const startOfWeek = getStartOfWeek(now)
			const elapsedMs = now.getTime() - startOfWeek.getTime()
			const totalMs = 7 * 24 * 60 * 60 * 1000
			return calculatePercentage(elapsedMs, totalMs)
		}
		case "day": {
			const elapsedMs = now.getTime() - startOfDay.getTime()
			const totalMs = 24 * 60 * 60 * 1000
			return calculatePercentage(elapsedMs, totalMs)
		}
	}
}

/**
 * Calculates how much of the year has passed.
 *
 * @param now - Current date/time (defaults to now)
 * @returns Percentage of year completed (0-100)
 */
export function getYearProgress(now: Date = new Date()): number {
	return getTimeProgress(now, "year")
}

/**
 * Calculates how much of the month has passed.
 *
 * @param now - Current date/time (defaults to now)
 * @returns Percentage of month completed (0-100)
 */
export function getMonthProgress(now: Date = new Date()): number {
	return getTimeProgress(now, "month")
}

/**
 * Calculates how much of the week has passed.
 *
 * Week starts on Sunday and ends on Saturday.
 *
 * @param now - Current date/time (defaults to now)
 * @returns Percentage of week completed (0-100)
 */
export function getWeekProgress(now: Date = new Date()): number {
	return getTimeProgress(now, "week")
}

/**
 * Calculates how much of the day has passed.
 *
 * Day starts at midnight (00:00) and ends at 23:59.
 *
 * @param now - Current date/time (defaults to now)
 * @returns Percentage of day completed (0-100)
 */
export function getDayProgress(now: Date = new Date()): number {
	return getTimeProgress(now, "day")
}

/**
 * Gets progress for all time periods at once.
 *
 * Useful for showing multiple progress bars at the same time.
 *
 * @param now - Current date/time (defaults to now)
 * @returns Object with year, month, week, and day progress as numbers
 */
export function getAllTimeProgress(now: Date = new Date()): {
	year: number
	month: number
	week: number
	day: number
} {
	return {
		year: getYearProgress(now),
		month: getMonthProgress(now),
		week: getWeekProgress(now),
		day: getDayProgress(now),
	}
}
