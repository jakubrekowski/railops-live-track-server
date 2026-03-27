import "dotenv/config"

import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import {
  loadTrainStates,
  upsertTrainLocation,
  upsertTrainStatus,
} from "./db/train-state-store.js"
import {
  catalogTrainIds,
  getCatalogTrain,
  getCatalogTrains,
} from "./lib/catalog.js"
import { mergeTrains, toLocationEntries } from "./lib/merge.js"
import type { TrainStatus } from "./lib/types.js"
import { requireApiKey } from "./middleware/api-key.js"

const app = new Hono()

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "x-api-key"],
    allowMethods: ["GET", "PATCH", "OPTIONS"],
  }),
)

app.get("/health", (c) => c.json({ ok: true }))

app.get("/trains", async (c) => {
  const trains = getCatalogTrains()
  const states = await loadTrainStates(trains.map((t) => t.id))
  return c.json({ trains: mergeTrains(trains, states) })
})

app.get("/locations", async (c) => {
  const idsParam = c.req.query("ids")
  const allowed = catalogTrainIds()
  let trains = getCatalogTrains()
  if (idsParam) {
    const requested = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const invalid = requested.filter((id) => !allowed.has(id))
    if (invalid.length > 0) {
      return c.json(
        { error: "Unknown train id(s)", ids: invalid },
        400,
      )
    }
    trains = trains.filter((t) => requested.includes(t.id))
  }
  const states = await loadTrainStates(trains.map((t) => t.id))
  const merged = mergeTrains(trains, states)
  return c.json({ locations: toLocationEntries(merged) })
})

const statusValues: TrainStatus[] = ["planned", "live", "ended"]

app.patch("/trains/:id/status", requireApiKey, async (c) => {
  const id = c.req.param("id")
  if (!catalogTrainIds().has(id)) {
    return c.json({ error: "Train not found" }, 404)
  }
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400)
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    typeof (body as { status: unknown }).status !== "string"
  ) {
    return c.json({ error: "Expected { status: string }" }, 400)
  }
  const status = (body as { status: string }).status as TrainStatus
  if (!statusValues.includes(status)) {
    return c.json(
      { error: "Invalid status", allowed: statusValues },
      400,
    )
  }
  const catalog = getCatalogTrain(id)!
  await upsertTrainStatus(id, status)
  const states = await loadTrainStates([id])
  return c.json({ train: mergeTrains([catalog], states)[0] })
})

app.patch("/trains/:id/location", requireApiKey, async (c) => {
  const id = c.req.param("id")
  if (!catalogTrainIds().has(id)) {
    return c.json({ error: "Train not found" }, 404)
  }
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400)
  }
  if (typeof body !== "object" || body === null) {
    return c.json({ error: "Expected { lat, lng }" }, 400)
  }
  const { lat, lng } = body as { lat?: unknown; lng?: unknown }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return c.json({ error: "lat and lng must be numbers" }, 400)
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return c.json({ error: "lat and lng must be finite" }, 400)
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return c.json({ error: "lat/lng out of range" }, 400)
  }
  const catalog = getCatalogTrain(id)!
  await upsertTrainLocation(id, lat, lng, catalog.status)
  const states = await loadTrainStates([id])
  return c.json({ train: mergeTrains([catalog], states)[0] })
})

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
})
