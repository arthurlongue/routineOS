/**
 * A task template that defines what to do and when.
 *
 * Blocks are the master templates. Entries are copies of blocks
 * for a specific day.
 */
export interface Block {
	/** Unique ID for this block */
	id: string
	/** URL-friendly identifier (must be unique) */
	slug: string
	/** Display name shown to the user */
	label: string
	/** Emoji or short icon text */
	icon: string
	/** Color in hex format (e.g., "#22d3ee") */
	color: string
	/** Category for grouping blocks */
	category: BlockCategory
	/** Planned duration in minutes */
	defaultDurationMin: number
	/** Order in the list (lower numbers come first) */
	order: number
	/** Which days this block appears (0=Sunday, 6=Saturday) */
	daysOfWeek: number[]
	/** If true, this block sets the schedule for following blocks */
	isAnchor: boolean
	/** Start time for anchor blocks in "HH:MM" format */
	anchorTime?: string
	/** If false, user cannot skip this task */
	isSkippable: boolean
	/** Priority for cutting when day is too full (1-99) */
	cutPriority: number
	/** When this block was created */
	createdAt: string
	/** When this block was last updated */
	updatedAt: string
}

/**
 * A record of a specific day.
 *
 * Day logs group all entries for a single date.
 */
export interface DayLog {
	/** Unique ID for this day log */
	id: string
	/** Date in "YYYY-MM-DD" format */
	date: string
	/** When this day log was created */
	createdAt: string
	/** When this day log was last updated */
	updatedAt: string
}

/**
 * A specific instance of a block on a specific day.
 *
 * Entries track the status and timing of tasks.
 */
export interface BlockEntry {
	/** Unique ID for this entry */
	id: string
	/** ID of the day log this entry belongs to */
	dayLogId: string
	/** ID of the block this entry is based on */
	blockId: string
	/** Current status of this entry */
	status: BlockStatus
	/** When this task was started (ISO date) */
	startedAt?: string
	/** When this task was completed (ISO date) */
	completedAt?: string
	/** When this task was skipped (ISO date) */
	skippedAt?: string
	/** Actual duration in minutes (only for completed tasks) */
	durationMin?: number
	/** Order in the day's schedule */
	order: number
	/** User notes about this entry */
	notes?: string
}

/**
 * Combined block and entry for display.
 *
 * This is what the UI uses to show a day's tasks.
 */
export interface DayItem {
	/** The block template */
	block: Block
	/** The entry for this day */
	entry: BlockEntry
}

/**
 * Complete view of a day.
 *
 * Contains the day log and all items for that day.
 */
export interface DayView {
	/** The day log record */
	dayLog: DayLog
	/** All blocks and entries for this day */
	items: DayItem[]
}

/**
 * Template data for a block (without runtime fields).
 *
 * Used when creating new blocks from defaults.
 */
export interface SeedBlock {
	slug: string
	label: string
	icon: string
	color: string
	category: BlockCategory
	defaultDurationMin: number
	order: number
	daysOfWeek: number[]
	isAnchor: boolean
	anchorTime?: string
	isSkippable: boolean
	cutPriority: number
}

/**
 * Quick summary of day's progress.
 *
 * Shows how many tasks were done.
 */
export interface ProgressSnapshot {
	/** Number of completed tasks */
	completed: number
	/** Number of skipped tasks */
	skipped: number
	/** Total number of tasks for the day */
	total: number
}

/**
 * Categories for organizing blocks.
 */
export const BLOCK_CATEGORIES = ["anchor", "sequence", "flexible"] as const

/**
 * Possible states for a task entry.
 */
export const BLOCK_STATUSES = ["pending", "active", "completed", "skipped"] as const

/**
 * Block category type.
 * "anchor" = sets schedule time
 * "sequence" = must follow order
 * "flexible" = can be reordered freely
 */
export type BlockCategory = (typeof BLOCK_CATEGORIES)[number]

/**
 * Entry status type.
 * "pending" = not started
 * "active" = currently in progress
 * "completed" = finished
 * "skipped" = intentionally skipped
 */
export type BlockStatus = (typeof BLOCK_STATUSES)[number]
