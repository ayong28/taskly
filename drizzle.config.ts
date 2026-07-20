import type { Config } from "drizzle-kit";

export default {
  schema: "./packages/core/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/project-manager.db",
  },
} satisfies Config;
