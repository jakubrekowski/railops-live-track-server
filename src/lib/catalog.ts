import trainsJson from "../data/trains.json" with { type: "json" }
import type { CatalogTrain } from "./types.js"

const catalog = trainsJson as CatalogTrain[]

const byId = new Map(catalog.map((t) => [t.id, t]))

export function getCatalogTrains(): CatalogTrain[] {
  return catalog
}

export function getCatalogTrain(id: string): CatalogTrain | undefined {
  return byId.get(id)
}

export function catalogTrainIds(): Set<string> {
  return new Set(catalog.map((t) => t.id))
}
