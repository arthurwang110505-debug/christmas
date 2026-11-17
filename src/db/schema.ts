import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Optional "Home Sync" for the Family Wall. A home is identified by an
 * unguessable code that the family shares between their own devices.
 * Nothing here is required for the site to work — every feature falls
 * back to on-device storage when the database is unavailable.
 */
export const homes = pgTable("homes", {
  code: text("code").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const wallMessages = pgTable(
  "wall_messages",
  {
    id: uuid("id").primaryKey(),
    homeCode: text("home_code")
      .notNull()
      .references(() => homes.code, { onDelete: "cascade" }),
    author: text("author").notNull(),
    body: text("body").notNull(),
    kind: text("kind").notNull(),
    tone: text("tone").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wall_messages_home_idx").on(t.homeCode, t.createdAt)],
);
