import { nanoid } from "nanoid"

import { DEFAULT_BLOCKS } from "@/lib/data/default-blocks"
import { getDb } from "@/lib/db"
import type { Block, BlockCategory, BlockStatus, DayItem, DayView } from "@/lib/types"
import { getBlocksForDay } from "@/lib/utils/blocks"
import { getWeekday } from "@/lib/utils/dates"
import { diffMinutes } from "@/lib/utils/time"

interface MutateEntryInput {
	entryId: string
	status: BlockStatus
	durationMin?: number
	notes?: string
}

interface SaveBlockInput {
	slug: string
	label: string
	icon: string
	color: string
	category: BlockCategory
	defaultDurationMin: number
	daysOfWeek: number[]
	isAnchor: boolean
	anchorTime?: string
	isSkippable: boolean
	cutPriority: number
}

/**
 * Makes sure the database has default blocks.
 *
 * If the database is empty, it adds all default blocks.
 * If blocks already exist, it just updates Portuguese labels.
 * This runs automatically when you first open the app.
 */
export async function ensureSeeded(): Promise<void> {
	const db = getDb()
	const count = await db.blocks.count()
	if (count > 0) {
		await normalizeSeedLabelsPtBr()
		return
	}

	const now = new Date().toISOString()
	const blocks: Block[] = DEFAULT_BLOCKS.map((block) => ({
		id: nanoid(),
		...block,
		createdAt: now,
		updatedAt: now,
	}))

	await db.blocks.bulkAdd(blocks)
	await normalizeSeedLabelsPtBr()
}

/**
 * Gets or creates the day view for a specific date.
 *
 * This is the main function to get all tasks for a day.
 * It creates the day log and entries if they don't exist yet.
 * It also syncs entries to match current block configuration.
 *
 * @param dateKey - Date in "YYYY-MM-DD" format
 * @returns Day view with day log and all items (blocks + entries)
 */
export async function getOrCreateDayView(dateKey: string): Promise<DayView> {
	const db = getDb()
	await ensureSeeded()
	const dayOfWeek = getWeekday(dateKey)
	const allBlocks = await db.blocks.toArray()
	const blocksForDay = getBlocksForDay(allBlocks, dayOfWeek)

	let dayLog = await db.dayLogs.where("date").equals(dateKey).first()
	if (!dayLog) {
		const dayLogId = nanoid()
		const now = new Date().toISOString()

		const createdDayLog = {
			id: dayLogId,
			date: dateKey,
			createdAt: now,
			updatedAt: now,
		}

		const entries = blocksForDay.map((block) => ({
			id: nanoid(),
			dayLogId,
			blockId: block.id,
			status: "pending" as const,
			order: block.order,
		}))

		await db.transaction("rw", db.dayLogs, db.blockEntries, async () => {
			await db.dayLogs.add(createdDayLog)
			if (entries.length > 0) {
				await db.blockEntries.bulkAdd(entries)
			}
		})

		dayLog = createdDayLog
	}

	await syncDayEntries(dayLog.id, blocksForDay)

	const entries = await db.blockEntries.where("dayLogId").equals(dayLog.id).sortBy("order")

	const blockIds = entries.map((entry) => entry.blockId)
	const blocks = await db.blocks.bulkGet(blockIds)
	const allowedBlockIds = new Set(blocksForDay.map((block) => block.id))
	const blockById = new Map(
		blocks.filter((block): block is Block => Boolean(block)).map((block) => [block.id, block]),
	)

	const items: DayItem[] = entries
		.map((entry) => {
			const block = blockById.get(entry.blockId)
			if (!block || !allowedBlockIds.has(block.id)) {
				return null
			}
			return {
				entry,
				block,
			}
		})
		.filter((item): item is DayItem => item !== null)

	return {
		dayLog,
		items,
	}
}

/**
 * Changes the status of a task entry.
 *
 * This is the ONLY way to change entry status. It handles all the
 * cleanup needed for each status change. For example, when you
 * activate a task, it automatically pauses any other active tasks.
 *
 * @param input - Entry ID and the new status
 *
 * @example
 * // Start a task
 * await mutateEntryStatus({ entryId: "abc123", status: "active" })
 *
 * @example
 * // Complete a task with specific duration
 * await mutateEntryStatus({
 *   entryId: "abc123",
 *   status: "completed",
 *   durationMin: 45
 * })
 */
export async function mutateEntryStatus(input: MutateEntryInput): Promise<void> {
	const db = getDb()
	const entry = await db.blockEntries.get(input.entryId)
	if (!entry) {
		return
	}

	const now = new Date().toISOString()

	if (input.status === "active") {
		const activeEntries = await db.blockEntries
			.where("dayLogId")
			.equals(entry.dayLogId)
			.and((candidate) => candidate.status === "active" && candidate.id !== entry.id)
			.toArray()

		if (activeEntries.length > 0) {
			await Promise.all(
				activeEntries.map((activeEntry) =>
					db.blockEntries.update(activeEntry.id, {
						status: "pending",
						startedAt: undefined,
						completedAt: undefined,
						skippedAt: undefined,
						durationMin: undefined,
					}),
				),
			)
		}
	}

	if (input.status === "pending") {
		await db.blockEntries.update(entry.id, {
			status: "pending",
			startedAt: undefined,
			completedAt: undefined,
			skippedAt: undefined,
			durationMin: undefined,
			notes: undefined,
		})
	} else if (input.status === "skipped") {
		await db.blockEntries.update(entry.id, {
			status: "skipped",
			skippedAt: now,
			completedAt: undefined,
			durationMin: undefined,
			notes: undefined,
		})
	} else if (input.status === "active") {
		await db.blockEntries.update(entry.id, {
			status: "active",
			startedAt: entry.startedAt ?? now,
			skippedAt: undefined,
			completedAt: undefined,
			notes: undefined,
		})
	} else if (input.status === "completed") {
		const startedAt = entry.startedAt ?? now
		const durationMin =
			typeof input.durationMin === "number"
				? Math.max(1, Math.round(input.durationMin))
				: diffMinutes(startedAt, now)

		await db.blockEntries.update(entry.id, {
			status: "completed",
			startedAt,
			completedAt: now,
			skippedAt: undefined,
			durationMin,
			notes: input.notes,
		})
	}

	await touchDayLog(entry.dayLogId)
}

/**
 * Gets all blocks in order.
 *
 * @returns All blocks sorted by their order field
 */
export async function listBlocks(): Promise<Block[]> {
	const db = getDb()
	return db.blocks.orderBy("order").toArray()
}

/**
 * Creates a new block.
 *
 * The block gets added at the end of the list.
 * The slug is automatically made unique.
 *
 * @param input - Block details
 * @returns The newly created block
 */
export async function createBlock(input: SaveBlockInput): Promise<Block> {
	const db = getDb()
	const now = new Date().toISOString()
	const blocks = await db.blocks.orderBy("order").toArray()
	const nextOrder = blocks.length > 0 ? Math.max(...blocks.map((block) => block.order)) + 10 : 0

	const block: Block = {
		id: nanoid(),
		slug: getUniqueSlug(input.slug, blocks),
		label: input.label.trim(),
		icon: sanitizeIcon(input.icon),
		color: sanitizeColor(input.color),
		category: input.category,
		defaultDurationMin: sanitizeDuration(input.defaultDurationMin),
		order: nextOrder,
		daysOfWeek: sanitizeDays(input.daysOfWeek),
		isAnchor: input.isAnchor,
		anchorTime: sanitizeAnchorTime(input.isAnchor, input.anchorTime),
		isSkippable: input.isSkippable,
		cutPriority: sanitizeCutPriority(input.cutPriority),
		createdAt: now,
		updatedAt: now,
	}

	await db.blocks.add(block)
	return block
}

/**
 * Updates an existing block.
 *
 * @param blockId - ID of the block to update
 * @param input - New block details
 */
export async function updateBlock(blockId: string, input: SaveBlockInput): Promise<void> {
	const db = getDb()
	const current = await db.blocks.get(blockId)
	if (!current) {
		return
	}

	const blocks = await db.blocks.toArray()
	const block = {
		slug: getUniqueSlug(
			input.slug,
			blocks.filter((candidate) => candidate.id !== blockId),
		),
		label: input.label.trim(),
		icon: sanitizeIcon(input.icon),
		color: sanitizeColor(input.color),
		category: input.category,
		defaultDurationMin: sanitizeDuration(input.defaultDurationMin),
		daysOfWeek: sanitizeDays(input.daysOfWeek),
		isAnchor: input.isAnchor,
		anchorTime: sanitizeAnchorTime(input.isAnchor, input.anchorTime),
		isSkippable: input.isSkippable,
		cutPriority: sanitizeCutPriority(input.cutPriority),
		updatedAt: new Date().toISOString(),
	}

	await db.blocks.update(blockId, block)
}

/**
 * Deletes a block.
 *
 * @param blockId - ID of the block to delete
 */
export async function deleteBlock(blockId: string): Promise<void> {
	const db = getDb()
	await db.blocks.delete(blockId)
}

/**
 * Moves a block up or down in the order.
 *
 * Changes the order field to swap with adjacent block.
 *
 * @param blockId - ID of the block to move
 * @param direction - "up" or "down"
 */
export async function moveBlock(blockId: string, direction: "up" | "down"): Promise<void> {
	const db = getDb()
	const blocks = await db.blocks.orderBy("order").toArray()
	const fromIndex = blocks.findIndex((block) => block.id === blockId)
	if (fromIndex < 0) {
		return
	}

	const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1
	if (toIndex < 0 || toIndex >= blocks.length) {
		return
	}

	const reordered = [...blocks]
	const [moved] = reordered.splice(fromIndex, 1)
	reordered.splice(toIndex, 0, moved)

	const now = new Date().toISOString()
	await db.transaction("rw", db.blocks, async () => {
		await Promise.all(
			reordered.map((block, index) =>
				db.blocks.update(block.id, {
					order: index * 10,
					updatedAt: now,
				}),
			),
		)
	})
}

/**
 * Updates the updatedAt timestamp of a day log.
 *
 * Called whenever entries for that day are modified.
 *
 * @param dayLogId - ID of the day log to update
 */
async function touchDayLog(dayLogId: string): Promise<void> {
	const db = getDb()
	await db.dayLogs.update(dayLogId, {
		updatedAt: new Date().toISOString(),
	})
}

/**
 * Syncs entries for a day to match current block configuration.
 *
 * - Adds entries for new blocks that should appear on this day
 * - Updates order of existing entries to match block order
 * - Removes entries for blocks that no longer appear on this day
 *
 * This ensures the day view always matches the current block setup.
 *
 * @param dayLogId - ID of the day log
 * @param blocksForDay - Blocks that should appear on this day
 */
async function syncDayEntries(dayLogId: string, blocksForDay: Block[]): Promise<void> {
	const db = getDb()
	const entries = await db.blockEntries.where("dayLogId").equals(dayLogId).toArray()
	const entryByBlockId = new Map(entries.map((entry) => [entry.blockId, entry]))
	const allowedBlockIds = new Set(blocksForDay.map((block) => block.id))

	const missingEntries = blocksForDay
		.filter((block) => !entryByBlockId.has(block.id))
		.map((block) => ({
			id: nanoid(),
			dayLogId,
			blockId: block.id,
			status: "pending" as const,
			order: block.order,
		}))

	const orderUpdates = entries
		.map((entry) => {
			const block = blocksForDay.find((candidate) => candidate.id === entry.blockId)
			if (!block || block.order === entry.order) {
				return null
			}
			return {
				id: entry.id,
				order: block.order,
			}
		})
		.filter((item): item is { id: string; order: number } => item !== null)

	const stalePendingEntryIds = entries
		.filter((entry) => !allowedBlockIds.has(entry.blockId) && entry.status === "pending")
		.map((entry) => entry.id)

	if (
		missingEntries.length === 0 &&
		orderUpdates.length === 0 &&
		stalePendingEntryIds.length === 0
	) {
		return
	}

	await db.transaction("rw", db.blockEntries, async () => {
		if (missingEntries.length > 0) {
			await db.blockEntries.bulkAdd(missingEntries)
		}
		if (orderUpdates.length > 0) {
			await Promise.all(
				orderUpdates.map((item) =>
					db.blockEntries.update(item.id, {
						order: item.order,
					}),
				),
			)
		}
		if (stalePendingEntryIds.length > 0) {
			await db.blockEntries.bulkDelete(stalePendingEntryIds)
		}
	})
}

/**
 * Ensures duration is not negative.
 *
 * @param value - Duration in minutes
 * @returns Sanitized duration (0 or positive)
 */
function sanitizeDuration(value: number): number {
	return Math.max(0, Math.round(value))
}

/**
 * Ensures cut priority is between 1 and 99.
 *
 * @param value - Priority value
 * @returns Sanitized priority (1-99)
 */
function sanitizeCutPriority(value: number): number {
	return Math.min(99, Math.max(1, Math.round(value)))
}

/**
 * Cleans up days of week array.
 *
 * - Removes duplicates
 * - Keeps only valid days (0-6)
 * - Sorts ascending
 * - If empty, defaults to all days (0-6)
 *
 * @param daysOfWeek - Array of day numbers
 * @returns Cleaned days of week array
 */
function sanitizeDays(daysOfWeek: number[]): number[] {
	const normalized = [...new Set(daysOfWeek)]
		.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
		.sort((a, b) => a - b)

	if (normalized.length > 0) {
		return normalized
	}
	return [0, 1, 2, 3, 4, 5, 6]
}

/**
 * Gets anchor time for an anchor block.
 *
 * If the block is an anchor and has a valid time, returns it.
 * If the block is an anchor but time is invalid, returns "06:00".
 * If the block is not an anchor, returns undefined.
 *
 * @param isAnchor - Whether this is an anchor block
 * @param anchorTime - Proposed anchor time in "HH:MM" format
 * @returns Validated anchor time or undefined
 */
function sanitizeAnchorTime(isAnchor: boolean, anchorTime?: string): string | undefined {
	if (!isAnchor) {
		return undefined
	}
	if (anchorTime && /^\d{2}:\d{2}$/.test(anchorTime)) {
		return anchorTime
	}
	return "06:00"
}

/**
 * Validates and cleans up a color value.
 *
 * Returns the color if it's a valid hex color (#000000-#FFFFFF).
 * Otherwise returns the default teal color.
 *
 * @param value - Color string
 * @returns Valid hex color
 */
function sanitizeColor(value: string): string {
	const trimmed = value.trim()
	if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
		return trimmed
	}
	return "#22d3ee"
}

/**
 * Validates and cleans up an icon value.
 *
 * Trims whitespace and limits to 8 characters.
 * Returns a checkmark emoji if empty.
 *
 * @param value - Icon string
 * @returns Cleaned icon
 */
function sanitizeIcon(value: string): string {
	const trimmed = value.trim()
	if (trimmed.length > 0) {
		return trimmed.slice(0, 8)
	}
	return "✅"
}

/**
 * Creates a unique slug for a block.
 *
 * If the base slug is available, uses it.
 * If not, appends a number (e.g., "tarefa-2").
 * Keeps trying numbers until it finds an unused one.
 *
 * @param baseSlug - Desired slug
 * @param existing - List of existing blocks to check against
 * @returns Unique slug
 */
function getUniqueSlug(baseSlug: string, existing: Block[]): string {
	const base = normalizeSlug(baseSlug)
	if (!existing.some((block) => block.slug === base)) {
		return base
	}

	let count = 2
	let candidate = `${base}-${count}`
	while (existing.some((block) => block.slug === candidate)) {
		count += 1
		candidate = `${base}-${count}`
	}
	return candidate
}

/**
 * Normalizes a slug string.
 *
 * - Trims whitespace
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 * - Generates random slug if result is empty
 *
 * @param value - Raw slug string
 * @returns Normalized slug
 */
function normalizeSlug(value: string): string {
	const trimmed = value.trim().toLowerCase()
	const normalized = trimmed.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
	if (normalized.length > 0) {
		return normalized
	}
	return `tarefa-${nanoid(6)}`
}

/**
 * Updates Portuguese labels for default blocks.
 *
 * Ensures default blocks have proper Portuguese names.
 * This runs after seeding the database.
 */
async function normalizeSeedLabelsPtBr(): Promise<void> {
	const db = getDb()
	const now = new Date().toISOString()
	const labelBySlug: Record<string, string> = {
		desacelerar: "Desacelerar",
		"trabalho-focado-1": "Trabalho focado 1",
		"trabalho-focado-2": "Trabalho focado 2",
		"preparo-refeicoes": "Preparo de refeições",
		"revisao-semanal": "Revisão semanal",
	}

	const updates = Object.entries(labelBySlug).map(async ([slug, label]) => {
		const block = await db.blocks.where("slug").equals(slug).first()
		if (!block || block.label === label) {
			return
		}

		await db.blocks.update(block.id, {
			label,
			updatedAt: now,
		})
	})

	await Promise.all(updates)
}
