import type { TrainStateRow } from "../db/schema.js"
import type { CatalogTrain, LocationEntry, TrainResponse } from "./types.js"

function mergeOne(
  train: CatalogTrain,
  state: TrainStateRow | undefined,
): TrainResponse {
  const status = (state?.status as TrainResponse["status"]) ?? train.status
  const hasDbCoords =
    state?.latitude != null &&
    state?.longitude != null &&
    !Number.isNaN(state.latitude) &&
    !Number.isNaN(state.longitude)

  const position = hasDbCoords
    ? { lat: state.latitude!, lng: state.longitude! }
    : train.position

  return {
    ...train,
    status,
    position,
    locationUpdatedAt: hasDbCoords
      ? state!.updatedAt.toISOString()
      : undefined,
  }
}

export function mergeTrains(
  trains: CatalogTrain[],
  states: Map<string, TrainStateRow>,
): TrainResponse[] {
  return trains.map((t) => mergeOne(t, states.get(t.id)))
}

export function toLocationEntries(
  trains: TrainResponse[],
): LocationEntry[] {
  return trains
    .filter((t) => t.position != null)
    .map((t) => ({
      trainId: t.id,
      lat: t.position!.lat,
      lng: t.position!.lng,
      updatedAt: t.locationUpdatedAt ?? null,
    }))
}
