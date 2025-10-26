import { defineConfig } from "drizzle-kit";

// Use Turso (libSQL) for production
const dbUrl = process.env.DATABASE_URL || "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: authToken,
  },
});
