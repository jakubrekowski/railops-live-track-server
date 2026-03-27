import { eq, inArray } from "drizzle-orm"
import { db } from "./index.js"
import { trainStates, type TrainStateRow } from "./schema.js"

const memory = new Map<string, TrainStateRow>()

function useNeon(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

let warnedNoDb = false

function warnInMemory() {
  if (!warnedNoDb) {
    warnedNoDb = true
    console.warn(
      "[railops-live-track-server] DATABASE_URL not set — using in-memory train state (lost on restart).",
    )
  }
}

export async function loadTrainStates(
  ids: string[],
): Promise<Map<string, TrainStateRow>> {
  if (ids.length === 0) {
    return new Map()
  }
  if (!useNeon()) {
    warnInMemory()
    const out = new Map<string, TrainStateRow>()
    for (const id of ids) {
      const row = memory.get(id)
      if (row) {
        out.set(id, row)
      }
    }
    return out
  }
  const rows = await db()
    .select()
    .from(trainStates)
    .where(inArray(trainStates.trainId, ids))
  return new Map(rows.map((r) => [r.trainId, r]))
}

export async function upsertTrainStatus(trainId: string, status: string) {
  const now = new Date()
  if (!useNeon()) {
    warnInMemory()
    const prev = memory.get(trainId)
    memory.set(trainId, {
      trainId,
      status,
      latitude: prev?.latitude ?? null,
      longitude: prev?.longitude ?? null,
      updatedAt: now,
    })
    return
  }
  await db()
    .insert(trainStates)
    .values({
      trainId,
      status,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: trainStates.trainId,
      set: { status, updatedAt: now },
    })
}

export async function upsertTrainLocation(
  trainId: string,
  lat: number,
  lng: number,
  catalogStatus: string,
) {
  const now = new Date()
  if (!useNeon()) {
    warnInMemory()
    const prev = memory.get(trainId)
    const status = prev?.status ?? catalogStatus
    memory.set(trainId, {
      trainId,
      status,
      latitude: lat,
      longitude: lng,
      updatedAt: now,
    })
    return
  }
  const [existing] = await db()
    .select()
    .from(trainStates)
    .where(eq(trainStates.trainId, trainId))
    .limit(1)
  const status = existing?.status ?? catalogStatus
  await db()
    .insert(trainStates)
    .values({
      trainId,
      status,
      latitude: lat,
      longitude: lng,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: trainStates.trainId,
      set: {
        latitude: lat,
        longitude: lng,
        updatedAt: now,
      },
    })
}
