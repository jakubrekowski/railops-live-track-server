import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const trainStates = pgTable("train_states", {
  trainId: text("train_id").primaryKey(),
  status: text("status").notNull().default("planned"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type TrainStateRow = typeof trainStates.$inferSelect
export type TrainStateInsert = typeof trainStates.$inferInsert
