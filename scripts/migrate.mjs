// Applies pending migrations in ./drizzle over Neon's HTTP driver.
// drizzle-kit's own `migrate` command connects via websocket, which hangs in
// some environments; this uses the same fetch-based driver as the app itself.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set");
}

const db = drizzle(neon(url));

console.log("Applying migrations...");
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied ✓");
