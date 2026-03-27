export type TrainStatus = "planned" | "live" | "ended"

export interface CatalogTrain {
  id: string
  numbers: string[]
  name: string
  dateTime: string
  status: TrainStatus
  locomotive: string
  ticketUrl?: string
  soldOut?: boolean
  detailsUrl?: string
  organizer?: {
    name: string
    logoUrl: string
  }
  position?: { lat: number; lng: number }
  from: { station: string; departure: string }
  to: { station: string; arrival: string }
}

export interface TrainResponse extends CatalogTrain {
  locationUpdatedAt?: string
}

export interface LocationEntry {
  trainId: string
  lat: number
  lng: number
  /** Present when coordinates come from the database (live updates). */
  updatedAt: string | null
}
