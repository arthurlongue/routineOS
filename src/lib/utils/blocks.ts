import type { Block, BlockEntry, DayItem, ProgressSnapshot } from "@/lib/types"
import { minutesToClock, parseClockToMinutes } from "@/lib/utils/time"

/**
 * Gets all blocks that should appear on a specific day of the week.
 *
 * @param allBlocks - List of all available blocks
 * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns Blocks that appear on this day, sorted by order
 */
export function getBlocksForDay(allBlocks: Block[], dayOfWeek: number): Block[] {
	return allBlocks
		.filter((block) => block.daysOfWeek.includes(dayOfWeek))
		.sort((a, b) => a.order - b.order)
}

/**
 * Finds which entry should be considered active.
 *
 * Looks for an "active" entry first. If none exists, looks for the
 * earliest "pending" entry. This helps the UI know which task to show.
 *
 * @param entries - List of block entries for a day
 * @returns The ID of the active or earliest pending entry, or null if none
 */
export function getActiveEntryId(entries: BlockEntry[]): string | null {
	const sorted = [...entries].sort((a, b) => a.order - b.order)
	return (
		sorted.find((e) => e.status === "active")?.id ??
		sorted.find((e) => e.status === "pending")?.id ??
		null
	)
}

/**
 * Calculates what time each block should start.
 *
 * Uses anchor blocks to set the schedule. An anchor block has a fixed
 * start time. All blocks after it get times by adding durations.
 * If no anchor comes before a block, it starts at 06:00.
 *
 * @param items - Day items containing blocks and their entries
 * @returns Map of entry ID to start time in "HH:MM" format
 *
 * @example
 * // If anchor block starts at 09:00 and lasts 30 minutes:
 * // Next block will start at 09:30
 * const times = calculateEntryTimes(items)
 */
export function calculateEntryTimes(items: DayItem[]): Map<string, string> {
	const times = new Map<string, string>()
	let currentMinutes: number | null = null

	for (const item of items.sort((a, b) => a.entry.order - b.entry.order)) {
		if (item.block.isAnchor && item.block.anchorTime) {
			const anchorMinutes = parseClockToMinutes(item.block.anchorTime)
			times.set(item.entry.id, item.block.anchorTime)
			currentMinutes = anchorMinutes + getDurationMin(item)
			continue
		}

		if (currentMinutes === null) {
			currentMinutes = parseClockToMinutes("06:00")
		}

		times.set(item.entry.id, minutesToClock(currentMinutes))
		currentMinutes += getDurationMin(item)
	}

	return times
}

/**
 * Counts completed and skipped tasks for a day.
 *
 * @param items - Day items to analyze
 * @returns Object with counts of completed, skipped, and total tasks
 */
export function getProgress(items: DayItem[]): ProgressSnapshot {
	const completed = items.filter((item) => item.entry.status === "completed").length
	const skipped = items.filter((item) => item.entry.status === "skipped").length
	return {
		completed,
		skipped,
		total: items.length,
	}
}

function getDurationMin(item: DayItem): number {
	if (item.entry.status === "completed" && item.entry.durationMin) {
		return item.entry.durationMin
	}
	return item.block.defaultDurationMin
}
