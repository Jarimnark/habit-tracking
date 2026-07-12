// Applies pending migrations in ./drizzle over Neon's HTTP driver.
// drizzle-kit's own `migrate` command connects via websocket, which hangs in
// some environments; this uses the same fetch-based driver as the app itself.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const source = process.env.DATABASE_URL_UNPOOLED
  ? "DATABASE_URL_UNPOOLED"
  : "DATABASE_URL";
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set");
}

const host = new URL(url).hostname;
const isPlaceholder = host.includes("ep-xxx") || host.includes(".region.");
if (isPlaceholder || !/\.(aws|azure|gcp)\.neon\.tech$/.test(host)) {
  throw new Error(
    `${source} host "${host}" is ${isPlaceholder ? "still the .env.example placeholder" : "not a Neon endpoint"} — check your .env`,
  );
}

const db = drizzle(neon(url));

console.log(`Applying migrations via ${source} (${host})...`);
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied ✓");
