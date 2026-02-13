import Dexie, { type EntityTable } from "dexie"

import type { Block, BlockEntry, DayLog } from "@/lib/types"

/**
 * Main database class for RoutineOS.
 *
 * This class defines the database structure using Dexie.
 * It has three tables: blocks, dayLogs, and blockEntries.
 *
 * You should NOT create this class directly. Use getDb() instead.
 */
export class RoutineDb extends Dexie {
	blocks!: EntityTable<Block, "id">
	dayLogs!: EntityTable<DayLog, "id">
	blockEntries!: EntityTable<BlockEntry, "id">

	constructor() {
		super("routineos")
		this.version(1).stores({
			blocks: "id, slug, order, category",
			dayLogs: "id, date, createdAt",
			blockEntries: "id, dayLogId, blockId, status, [dayLogId+order]",
		})
	}
}

const dbGlobal = globalThis as typeof globalThis & {
	routineDb?: RoutineDb
}

/**
 * Gets the database instance.
 *
 * This function uses a singleton pattern. It creates the database
 * once and reuses it every time you call it. This is the ONLY
 * way you should get access to the database.
 *
 * @returns The shared RoutineDb instance
 *
 * @example
 * const db = getDb()
 * const blocks = await db.blocks.toArray()
 */
export function getDb(): RoutineDb {
	if (!dbGlobal.routineDb) {
		dbGlobal.routineDb = new RoutineDb()
	}
	return dbGlobal.routineDb
}
