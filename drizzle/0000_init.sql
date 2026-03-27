CREATE TABLE "train_states" (
	"train_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
