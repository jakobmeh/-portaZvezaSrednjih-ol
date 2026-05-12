import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

dotenv.config({ path: path.resolve(__dirname, ".env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Missing DIRECT_URL or DATABASE_URL");

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
});
